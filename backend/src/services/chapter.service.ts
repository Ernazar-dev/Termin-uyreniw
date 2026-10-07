import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import type { ChapterInput } from '../validators/chapter.validator';
import { classBriefSelect } from './selects';

const chapterInclude = {
  class: { select: classBriefSelect },
  _count: { select: { terms: true, games: true, tests: true } },
} satisfies Prisma.ChapterInclude;

const ensureUniqueOrder = async (classId: number, order: number, exceptId?: number) => {
  const existing = await prisma.chapter.findUnique({
    where: { classId_order: { classId, order } },
    select: { id: true },
  });
  if (existing && existing.id !== exceptId) {
    throw ApiError.conflict(`Bul klassta ${order}-tártip nomerli bap aldınnan bar`);
  }
};

const nextOrder = async (classId: number) => {
  const last = await prisma.chapter.aggregate({ where: { classId }, _max: { order: true } });
  return (last._max.order ?? 0) + 1;
};

export const chapterService = {
  list(classId?: number) {
    return prisma.chapter.findMany({
      where: classId ? { classId } : undefined,
      orderBy: [{ class: { order: 'asc' } }, { order: 'asc' }],
      include: chapterInclude,
    });
  },

  async getById(id: number) {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        ...chapterInclude,
        tests: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, description: true, _count: { select: { questions: true } } },
        },
      },
    });
    if (!chapter) throw ApiError.notFound('Bap tabılmadı');
    return chapter;
  },

  async create(input: ChapterInput) {
    const order = input.order ?? (await nextOrder(input.classId));
    await ensureUniqueOrder(input.classId, order);
    return prisma.chapter.create({ data: { ...input, order }, include: chapterInclude });
  },

  async update(id: number, input: ChapterInput) {
    const existing = await prisma.chapter.findUnique({ where: { id }, select: { classId: true } });
    if (!existing) throw ApiError.notFound('Bap tabılmadı');

    // Moving to another class puts the chapter last there; otherwise the position stays as is
    const order = input.order ?? (existing.classId !== input.classId ? await nextOrder(input.classId) : undefined);
    if (order !== undefined) await ensureUniqueOrder(input.classId, order, id);
    return prisma.chapter.update({ where: { id }, data: { ...input, order }, include: chapterInclude });
  },

  async remove(id: number) {
    await prisma.chapter.delete({ where: { id } });
  },
};
