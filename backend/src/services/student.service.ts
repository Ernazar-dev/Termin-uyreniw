import { Prisma, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { PaginatedResult } from '../types';
import { ApiError } from '../utils/ApiError';
import { toPagination, toSkipTake } from '../utils/pagination';
import type { CreateStudentInput, StudentQuery, UpdateStudentInput } from '../validators/student.validator';
import { ensureClassExists, ensureLoginIsFree, hashPassword } from './auth.service';
import { publicUserSelect, type PublicUser } from './selects';

type StudentListItem = PublicUser & {
  testsTaken: number;
  averagePercentage: number | null;
  viewedTerms: number;
};

const roundPercent = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

/** Attach result statistics to students in two grouped queries instead of N+1. */
const withStats = async (students: PublicUser[]): Promise<StudentListItem[]> => {
  const ids = students.map((student) => student.id);
  if (ids.length === 0) return [];

  const [resultStats, progressStats] = await Promise.all([
    prisma.testResult.groupBy({
      by: ['studentId'],
      where: { studentId: { in: ids } },
      _count: { _all: true },
      _avg: { percentage: true },
    }),
    prisma.studentProgress.groupBy({
      by: ['studentId'],
      where: { studentId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const resultsById = new Map(resultStats.map((stat) => [stat.studentId, stat]));
  const progressById = new Map(progressStats.map((stat) => [stat.studentId, stat._count._all]));

  return students.map((student) => {
    const stat = resultsById.get(student.id);
    return {
      ...student,
      testsTaken: stat?._count._all ?? 0,
      averagePercentage: roundPercent(stat?._avg.percentage ?? null),
      viewedTerms: progressById.get(student.id) ?? 0,
    };
  });
};

const studentWhere = (id: number): Prisma.UserWhereUniqueInput => ({ id, role: Role.STUDENT });

export const studentService = {
  async list(query: StudentQuery): Promise<PaginatedResult<StudentListItem>> {
    const pagination = toPagination(query.page, query.pageSize);
    const where: Prisma.UserWhereInput = {
      role: Role.STUDENT,
      classId: query.classId,
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
              { login: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {}),
    };

    const [students, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: [{ class: { order: 'asc' } }, { fullName: 'asc' }],
        ...toSkipTake(pagination),
      }),
      prisma.user.count({ where }),
    ]);

    return { items: await withStats(students), total, ...pagination };
  },

  async getById(id: number) {
    const student = await prisma.user.findUnique({ where: studentWhere(id), select: publicUserSelect });
    if (!student) throw ApiError.notFound('Oqıwshı tabılmadı');
    const [withStat] = await withStats([student]);
    return withStat;
  },

  async create(input: CreateStudentInput) {
    await Promise.all([ensureLoginIsFree(input.login), ensureClassExists(input.classId)]);
    return prisma.user.create({
      data: { ...input, password: await hashPassword(input.password), role: Role.STUDENT },
      select: publicUserSelect,
    });
  },

  async update(id: number, input: UpdateStudentInput) {
    await Promise.all([ensureLoginIsFree(input.login, id), ensureClassExists(input.classId)]);
    const { password, ...rest } = input;
    return prisma.user.update({
      where: studentWhere(id),
      data: { ...rest, ...(password ? { password: await hashPassword(password) } : {}) },
      select: publicUserSelect,
    });
  },

  async remove(id: number) {
    await prisma.user.delete({ where: studentWhere(id) });
  },
};
