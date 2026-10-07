import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { AuthUser, PaginatedResult } from '../types';
import { ApiError } from '../utils/ApiError';
import { toPagination, toSkipTake } from '../utils/pagination';
import type { ResultQuery } from '../validators/result.validator';
import { chapterBriefSelect, classBriefSelect } from './selects';

const resultListInclude = {
  student: { select: { id: true, fullName: true, class: { select: classBriefSelect } } },
  test: { select: { id: true, title: true, chapter: { select: chapterBriefSelect } } },
} satisfies Prisma.TestResultInclude;

type ResultListItem = Prisma.TestResultGetPayload<{ include: typeof resultListInclude }>;

const resultDetailInclude = {
  ...resultListInclude,
  answers: {
    orderBy: { question: { order: 'asc' } },
    include: {
      question: {
        select: {
          id: true,
          question: true,
          order: true,
          options: { orderBy: { id: 'asc' }, select: { id: true, text: true, isCorrect: true } },
        },
      },
    },
  },
} satisfies Prisma.TestResultInclude;

const buildWhere = (query: ResultQuery, user: AuthUser): Prisma.TestResultWhereInput => {
  const chapterFilter: Prisma.ChapterWhereInput = {};
  if (query.chapterId) chapterFilter.id = query.chapterId;
  if (query.classId) chapterFilter.classId = query.classId;

  return {
    // Students can only ever see their own results
    studentId: user.role === Role.STUDENT ? user.id : query.studentId,
    testId: query.testId,
    ...(Object.keys(chapterFilter).length ? { test: { chapter: chapterFilter } } : {}),
  };
};

export const resultService = {
  async list(query: ResultQuery, user: AuthUser): Promise<PaginatedResult<ResultListItem>> {
    const pagination = toPagination(query.page, query.pageSize);
    const where = buildWhere(query, user);

    const [items, total] = await prisma.$transaction([
      prisma.testResult.findMany({
        where,
        include: resultListInclude,
        orderBy: { submittedAt: 'desc' },
        ...toSkipTake(pagination),
      }),
      prisma.testResult.count({ where }),
    ]);

    return { items, total, ...pagination };
  },

  async getById(id: number, user: AuthUser) {
    const result = await prisma.testResult.findUnique({ where: { id }, include: resultDetailInclude });
    if (!result) throw ApiError.notFound('Nátiyje tabılmadı');
    if (user.role === Role.STUDENT && result.studentId !== user.id) throw ApiError.forbidden();

    const { answers, ...rest } = result;
    return {
      ...rest,
      wrongAnswers: result.totalQuestions - result.correctAnswers,
      questions: answers.map((answer) => ({
        questionId: answer.questionId,
        question: answer.question.question,
        order: answer.question.order,
        options: answer.question.options,
        selectedOptionId: answer.selectedOptionId,
        isCorrect: answer.isCorrect,
      })),
    };
  },

  async remove(id: number) {
    await prisma.testResult.delete({ where: { id } });
  },
};
