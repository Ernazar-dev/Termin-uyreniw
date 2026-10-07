import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { AuthUser } from '../types';
import { ApiError } from '../utils/ApiError';
import { toPublicImagePath, removeUploadedFile } from '../utils/file';
import { ANSWER_LETTERS, type FileTestInput, type SubmitTestInput, type TestInput, type TestQuery } from '../validators/test.validator';
import { resultService } from './result.service';
import { chapterBriefSelect, sanitizeOptions } from './selects';

const testListInclude = {
  chapter: { select: chapterBriefSelect },
  _count: { select: { questions: true, results: true } },
} satisfies Prisma.TestInclude;

const testDetailInclude = {
  chapter: { select: chapterBriefSelect },
  questions: {
    orderBy: { order: 'asc' },
    include: { options: { orderBy: { id: 'asc' } } },
  },
} satisfies Prisma.TestInclude;

type TestDetail = Prisma.TestGetPayload<{ include: typeof testDetailInclude }>;

const toQuestionsCreate = (questions: TestInput['questions']) =>
  questions.map((question, index) => ({
    question: question.question,
    order: index + 1,
    options: { create: question.options },
  }));

/** Comparable fingerprint of questions, used to detect edits of an already taken test. */
const fingerprint = (questions: { question: string; options: { text: string; isCorrect: boolean }[] }[]) =>
  JSON.stringify(
    questions.map((question) => [question.question, question.options.map((option) => [option.text, option.isCorrect])]),
  );

/** File tests print options as A, B, C ... on the sheet, so their order must never be shuffled. */
const present = (test: TestDetail, role: Role) => ({
  ...test,
  questions: test.questions.map((question) => ({
    ...question,
    options: test.fileUrl
      ? question.options.map(({ isCorrect, ...option }) => (role === Role.TEACHER ? { ...option, isCorrect } : option))
      : sanitizeOptions(question.options, role),
  })),
});

/** Turns the teacher's answer key (A, C, B ...) into ordinary questions with lettered options. */
export const questionsFromKey = ({ answerKey, optionCount }: Pick<FileTestInput, 'answerKey' | 'optionCount'>): TestInput['questions'] =>
  answerKey.map((correct, index) => ({
    question: `${index + 1}-soraw`,
    options: ANSWER_LETTERS.slice(0, optionCount).map((letter) => ({ text: letter, isCorrect: letter === correct })),
  }));

export interface StoredTestFile {
  filename: string;
  originalname: string;
}

export const testService = {
  async list(query: TestQuery, user?: AuthUser) {
    const tests = await prisma.test.findMany({
      where: {
        chapterId: query.chapterId,
        ...(query.classId ? { chapter: { classId: query.classId } } : {}),
      },
      include: {
        ...testListInclude,
        ...(user?.role === Role.STUDENT
          ? {
              results: {
                where: { studentId: user.id },
                orderBy: { submittedAt: 'desc' },
                take: 1,
                select: { id: true, percentage: true, correctAnswers: true, totalQuestions: true, submittedAt: true },
              },
            }
          : {}),
      },
      orderBy: [{ chapter: { class: { order: 'asc' } } }, { chapter: { order: 'asc' } }, { createdAt: 'asc' }],
    });

    // The file itself is only handed out by getById (signed-in users); guests just learn that one exists
    return tests.map(({ results, fileUrl, ...test }) => ({
      ...test,
      hasFile: Boolean(fileUrl),
      lastResult: results?.[0] ?? null,
    }));
  },

  async getById(id: number, role: Role) {
    const test = await prisma.test.findUnique({ where: { id }, include: testDetailInclude });
    if (!test) throw ApiError.notFound('Test tabılmadı');
    return present(test, role);
  },

  create(input: TestInput, authorId: number, file?: StoredTestFile) {
    return prisma.test.create({
      data: {
        chapterId: input.chapterId,
        title: input.title,
        description: input.description,
        ...(file ? { fileUrl: toPublicImagePath(file.filename), fileName: file.originalname } : {}),
        createdBy: authorId,
        questions: { create: toQuestionsCreate(input.questions) },
      },
      include: testListInclude,
    });
  },

  async update(id: number, input: TestInput, file?: StoredTestFile) {
    const existing = await prisma.test.findUnique({
      where: { id },
      include: { ...testDetailInclude, _count: { select: { results: true } } },
    });
    if (!existing) throw ApiError.notFound('Test tabılmadı');

    const questionsChanged = fingerprint(existing.questions) !== fingerprint(input.questions);
    if ((questionsChanged || file || input.chapterId !== existing.chapterId) && existing._count.results > 0) {
      throw ApiError.conflict(
        'Bul testti oqıwshılar tapsırǵan. Sorawlardı ózgertiw ushın jańa test jaratıń yamasa nátiyjelerdi saqlaw ushın tek atın ózgertiń',
      );
    }

    const updated = await prisma.test.update({
      where: { id },
      data: {
        chapterId: input.chapterId,
        title: input.title,
        description: input.description,
        ...(file ? { fileUrl: toPublicImagePath(file.filename), fileName: file.originalname } : {}),
        ...(questionsChanged
          ? { questions: { deleteMany: {}, create: toQuestionsCreate(input.questions) } }
          : {}),
      },
      include: testListInclude,
    });
    if (file) await removeUploadedFile(existing.fileUrl);
    return updated;
  },

  /** A file based update without a new file keeps the current sheet; without any sheet it is an error. */
  async requireSheet(id: number, file?: StoredTestFile) {
    if (file) return;
    const existing = await prisma.test.findUnique({ where: { id }, select: { fileUrl: true } });
    if (!existing) throw ApiError.notFound('Test tabılmadı');
    if (!existing.fileUrl) throw ApiError.badRequest('PDF yamasa Word fayl júklep qoyıń');
  },

  async remove(id: number) {
    const existing = await prisma.test.findUnique({ where: { id }, select: { fileUrl: true } });
    await prisma.test.delete({ where: { id } });
    await removeUploadedFile(existing?.fileUrl);
  },

  async submit(testId: number, studentId: number, { answers }: SubmitTestInput) {
    const test = await prisma.test.findUnique({ where: { id: testId }, include: testDetailInclude });
    if (!test) throw ApiError.notFound('Test tabılmadı');
    if (test.questions.length === 0) throw ApiError.badRequest('Testte sorawlar joq');

    const selectedByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.optionId]));
    if (selectedByQuestion.size !== answers.length) {
      throw ApiError.badRequest('Bir sorawǵa birneshe juwap beriw múmkin emes');
    }
    const questionIds = new Set(test.questions.map((question) => question.id));
    if (answers.some((answer) => !questionIds.has(answer.questionId))) {
      throw ApiError.badRequest('Soraw bul testke tiyisli emes');
    }

    const graded = test.questions.map((question) => {
      const selectedId = selectedByQuestion.get(question.id) ?? null;
      const selected = selectedId ? question.options.find((option) => option.id === selectedId) : undefined;
      if (selectedId && !selected) {
        throw ApiError.badRequest('Juwap variantı sorawǵa tiyisli emes');
      }
      return {
        questionId: question.id,
        selectedOptionId: selected?.id ?? null,
        isCorrect: Boolean(selected?.isCorrect),
      };
    });

    const correctAnswers = graded.filter((answer) => answer.isCorrect).length;
    const totalQuestions = graded.length;
    const percentage = Math.round((correctAnswers / totalQuestions) * 10000) / 100;

    const result = await prisma.testResult.create({
      data: {
        studentId,
        testId,
        correctAnswers,
        totalQuestions,
        percentage,
        answers: { create: graded },
      },
      select: { id: true },
    });

    return resultService.getById(result.id, { id: studentId, role: Role.STUDENT });
  },
};
