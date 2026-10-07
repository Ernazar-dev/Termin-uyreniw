import type { Request, Response } from 'express';
import { classService } from '../services/class.service';
import { getIdParam } from '../utils/request';
import { sendCreated, sendSuccess } from '../utils/response';
import { classSchema } from '../validators/class.validator';

export const classController = {
  async list(_req: Request, res: Response) {
    sendSuccess(res, await classService.list());
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await classService.getById(getIdParam(req)));
  },

  async create(req: Request, res: Response) {
    sendCreated(res, await classService.create(classSchema.parse(req.body)));
  },

  async update(req: Request, res: Response) {
    sendSuccess(res, await classService.update(getIdParam(req), classSchema.parse(req.body)));
  },

  async remove(req: Request, res: Response) {
    await classService.remove(getIdParam(req));
    sendSuccess(res, null);
  },
};
