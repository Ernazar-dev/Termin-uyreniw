import { Prisma, type Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import type { GameInput, GameQuery } from '../validators/game.validator';
import { chapterBriefSelect, sanitizeOptions } from './selects';

const gameInclude = {
  chapter: { select: chapterBriefSelect },
  term: { select: { id: true, name: true } },
  options: { orderBy: { id: 'asc' } },
} satisfies Prisma.GameInclude;

type GameWithRelations = Prisma.GameGetPayload<{ include: typeof gameInclude }>;

const present = (game: GameWithRelations, role: Role) => ({
  ...game,
  options: sanitizeOptions(game.options, role),
});

const toGameData = (input: GameInput) => ({
  chapterId: input.chapterId,
  termId: input.termId ?? null,
  type: input.type,
  question: input.question,
});

const ensureTermInChapter = async (termId: number | null | undefined, chapterId: number) => {
  if (!termId) return;
  const term = await prisma.term.findUnique({ where: { id: termId }, select: { chapterId: true } });
  if (!term || term.chapterId !== chapterId) {
    throw ApiError.badRequest('Tańlanǵan termin bul bapqa tiyisli emes');
  }
};

export const gameService = {
  async list(query: GameQuery, role: Role) {
    const where: Prisma.GameWhereInput = {
      chapterId: query.chapterId,
      termId: query.termId,
      type: query.type,
      ...(query.classId ? { chapter: { classId: query.classId } } : {}),
    };

    const games = await prisma.game.findMany({
      where,
      include: gameInclude,
      orderBy: [{ chapter: { class: { order: 'asc' } } }, { chapter: { order: 'asc' } }, { createdAt: 'asc' }],
    });

    return games.map((game) => present(game, role));
  },

  async getById(id: number, role: Role) {
    const game = await prisma.game.findUnique({ where: { id }, include: gameInclude });
    if (!game) throw ApiError.notFound('Oyın tabılmadı');
    return present(game, role);
  },

  async create(input: GameInput, role: Role) {
    await ensureTermInChapter(input.termId, input.chapterId);
    const game = await prisma.game.create({
      data: { ...toGameData(input), options: { create: input.options } },
      include: gameInclude,
    });
    return present(game, role);
  },

  async update(id: number, input: GameInput, role: Role) {
    await ensureTermInChapter(input.termId, input.chapterId);
    const game = await prisma.game.update({
      where: { id },
      data: {
        ...toGameData(input),
        options: { deleteMany: {}, create: input.options },
      },
      include: gameInclude,
    });
    return present(game, role);
  },

  async remove(id: number) {
    await prisma.game.delete({ where: { id } });
  },

  /** Games are not graded: we only tell the student whether the choice was right. */
  async check(id: number, optionId: number) {
    const options = await prisma.gameOption.findMany({
      where: { gameId: id },
      select: { id: true, isCorrect: true },
    });
    if (options.length === 0) throw ApiError.notFound('Oyın tabılmadı');

    const selected = options.find((option) => option.id === optionId);
    if (!selected) throw ApiError.badRequest('Variant bul oyınǵa tiyisli emes');

    const correct = options.find((option) => option.isCorrect);
    return { isCorrect: selected.isCorrect, correctOptionId: correct?.id ?? null };
  },
};
