import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import type { ClassInput } from '../validators/class.validator';

const countsInclude = { _count: { select: { chapters: true, students: true } } } as const;

export const classService = {
  list() {
    return prisma.class.findMany({
      orderBy: { order: 'asc' },
      include: countsInclude,
    });
  },

  async getById(id: number) {
    const found = await prisma.class.findUnique({
      where: { id },
      include: {
        ...countsInclude,
        chapters: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { terms: true, games: true, tests: true } } },
        },
      },
    });
    if (!found) throw ApiError.notFound('Klass tabılmadı');
    return found;
  },

  async create(input: ClassInput) {
    const order = input.order ?? (await nextOrder(input.name));
    await ensureUniqueOrder(order);
    return prisma.class.create({ data: { name: input.name, order }, include: countsInclude });
  },

  async update(id: number, input: ClassInput) {
    if (input.order !== undefined) await ensureUniqueOrder(input.order, id);
    return prisma.class.update({
      where: { id },
      data: { name: input.name, order: input.order },
      include: countsInclude,
    });
  },

  async remove(id: number) {
    await prisma.class.delete({ where: { id } });
  },
};

/** "10-klass" gets position 10 when free (so it sorts correctly); otherwise it goes last. */
async function nextOrder(name: string) {
  const fromName = Number(/^\s*(\d{1,3})/.exec(name)?.[1]);
  if (fromName > 0 && !(await prisma.class.findUnique({ where: { order: fromName }, select: { id: true } }))) {
    return fromName;
  }
  const last = await prisma.class.aggregate({ _max: { order: true } });
  return (last._max.order ?? 0) + 1;
}

async function ensureUniqueOrder(order: number, exceptId?: number) {
  const existing = await prisma.class.findUnique({ where: { order }, select: { id: true } });
  if (existing && existing.id !== exceptId) {
    throw ApiError.conflict(`${order}-tártip nomerli klass aldınnan bar`);
  }
}
