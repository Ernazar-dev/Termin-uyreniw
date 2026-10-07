import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { gameService } from '../services/game.service';
import { getAuthUser, getIdParam } from '../utils/request';
import { sendCreated, sendSuccess } from '../utils/response';
import { gameCheckSchema, gameQuerySchema, gameSchema } from '../validators/game.validator';

export const gameController = {
  async list(req: Request, res: Response) {
    sendSuccess(res, await gameService.list(gameQuerySchema.parse(req.query), req.user?.role ?? Role.STUDENT));
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await gameService.getById(getIdParam(req), req.user?.role ?? Role.STUDENT));
  },

  async create(req: Request, res: Response) {
    sendCreated(res, await gameService.create(gameSchema.parse(req.body), getAuthUser(req).role));
  },

  async update(req: Request, res: Response) {
    const input = gameSchema.parse(req.body);
    sendSuccess(res, await gameService.update(getIdParam(req), input, getAuthUser(req).role));
  },

  async remove(req: Request, res: Response) {
    await gameService.remove(getIdParam(req));
    sendSuccess(res, null);
  },

  async check(req: Request, res: Response) {
    const { optionId } = gameCheckSchema.parse(req.body);
    sendSuccess(res, await gameService.check(getIdParam(req), optionId));
  },
};
