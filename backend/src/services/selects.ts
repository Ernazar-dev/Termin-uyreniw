import { Prisma, Role } from '@prisma/client';

/** Shared Prisma selections so every endpoint returns the same shape. */

export const classBriefSelect = {
  id: true,
  name: true,
  order: true,
} satisfies Prisma.ClassSelect;

export const chapterBriefSelect = {
  id: true,
  title: true,
  order: true,
  classId: true,
  class: { select: classBriefSelect },
} satisfies Prisma.ChapterSelect;

export const publicUserSelect = {
  id: true,
  fullName: true,
  login: true,
  role: true,
  classId: true,
  class: { select: classBriefSelect },
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

interface OptionWithAnswer {
  id: number;
  text: string;
  isCorrect: boolean;
}

const shuffle = <T>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Students never receive the correct answer flag, and get options in random order
 * so the position of the right answer cannot be memorised. Teachers see the stored order.
 */
export const sanitizeOptions = <T extends OptionWithAnswer>(options: T[], role: Role) =>
  role === Role.TEACHER ? options : shuffle(options.map(({ isCorrect: _hidden, ...rest }) => rest));
