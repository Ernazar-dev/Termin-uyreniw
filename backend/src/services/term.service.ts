import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { AuthUser, PaginatedResult } from '../types';
import { ApiError } from '../utils/ApiError';
import { removeUploadedFile, toPublicImagePath } from '../utils/file';
import { toPagination, toSkipTake } from '../utils/pagination';
import type { TermInput, TermQuery } from '../validators/term.validator';
import { chapterBriefSelect } from './selects';

const termInclude = {
  chapter: { select: chapterBriefSelect },
} satisfies Prisma.TermInclude;

export type TermWithChapter = Prisma.TermGetPayload<{ include: typeof termInclude }>;

const buildWhere = ({ search, classId, chapterId }: TermQuery): Prisma.TermWhereInput => {
  const where: Prisma.TermWhereInput = {};

  if (chapterId) where.chapterId = chapterId;
  if (classId) where.chapter = { classId };

  if (search) {
    const contains = { contains: search, mode: Prisma.QueryMode.insensitive };
    where.OR = [
      { name: contains },
      { chapter: { title: contains } },
      { chapter: { class: { name: contains } } },
    ];
  }

  return where;
};

const toTermData = (input: TermInput) => ({
  chapterId: input.chapterId,
  name: input.name,
  definition: input.definition,
  example: input.example,
});

export const termService = {
  async list(query: TermQuery): Promise<PaginatedResult<TermWithChapter>> {
    const pagination = toPagination(query.page, query.pageSize);
    const where = buildWhere(query);

    const [items, total] = await prisma.$transaction([
      prisma.term.findMany({
        where,
        include: termInclude,
        orderBy: [{ chapter: { class: { order: 'asc' } } }, { chapter: { order: 'asc' } }, { name: 'asc' }],
        ...toSkipTake(pagination),
      }),
      prisma.term.count({ where }),
    ]);

    return { items, total, ...pagination };
  },

  async getById(id: number, user?: AuthUser) {
    const term = await prisma.term.findUnique({ where: { id }, include: termInclude });
    if (!term) throw ApiError.notFound('Termin tabılmadı');

    // Progress tracking and the sibling list are independent, so they run in parallel
    const recordProgress =
      user?.role === Role.STUDENT
        ? prisma.studentProgress.upsert({
            where: { studentId_termId: { studentId: user.id, termId: id } },
            create: { studentId: user.id, termId: id },
            update: { viewedAt: new Date() },
          })
        : Promise.resolve();

    const [siblings] = await Promise.all([
      prisma.term.findMany({
        where: { chapterId: term.chapterId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      recordProgress,
    ]);

    return { ...term, siblings };
  },

  create(input: TermInput, file: Express.Multer.File | undefined, authorId: number) {
    return prisma.term.create({
      data: {
        ...toTermData(input),
        image: file ? toPublicImagePath(file.filename) : null,
        createdBy: authorId,
      },
      include: termInclude,
    });
  },

  async update(id: number, input: TermInput, file: Express.Multer.File | undefined) {
    const existing = await prisma.term.findUnique({ where: { id }, select: { image: true } });
    if (!existing) throw ApiError.notFound('Termin tabılmadı');

    const shouldReplaceImage = Boolean(file) || input.removeImage;
    const nextImage = file ? toPublicImagePath(file.filename) : input.removeImage ? null : existing.image;

    const updated = await prisma.term.update({
      where: { id },
      data: { ...toTermData(input), image: nextImage },
      include: termInclude,
    });

    if (shouldReplaceImage) await removeUploadedFile(existing.image);
    return updated;
  },

  async remove(id: number) {
    const deleted = await prisma.term.delete({ where: { id }, select: { image: true } });
    await removeUploadedFile(deleted.image);
  },
};
