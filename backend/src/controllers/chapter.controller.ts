import type { Request, Response } from 'express';
import { chapterService } from '../services/chapter.service';
import { getIdParam } from '../utils/request';
import { sendCreated, sendSuccess } from '../utils/response';
import { chapterQuerySchema, chapterSchema } from '../validators/chapter.validator';

export const chapterController = {
  async list(req: Request, res: Response) {
    const { classId } = chapterQuerySchema.parse(req.query);
    sendSuccess(res, await chapterService.list(classId));
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await chapterService.getById(getIdParam(req)));
  },

  async create(req: Request, res: Response) {
    sendCreated(res, await chapterService.create(chapterSchema.parse(req.body)));
  },

  async update(req: Request, res: Response) {
    sendSuccess(res, await chapterService.update(getIdParam(req), chapterSchema.parse(req.body)));
  },

  async remove(req: Request, res: Response) {
    await chapterService.remove(getIdParam(req));
    sendSuccess(res, null);
  },
};
