import type { Request, Response } from 'express';
import { termService } from '../services/term.service';
import { getAuthUser, getIdParam } from '../utils/request';
import { sendCreated, sendSuccess } from '../utils/response';
import { termQuerySchema, termSchema } from '../validators/term.validator';

export const termController = {
  async list(req: Request, res: Response) {
    sendSuccess(res, await termService.list(termQuerySchema.parse(req.query)));
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await termService.getById(getIdParam(req), req.user));
  },

  async create(req: Request, res: Response) {
    const input = termSchema.parse(req.body);
    sendCreated(res, await termService.create(input, req.file, getAuthUser(req).id));
  },

  async update(req: Request, res: Response) {
    const input = termSchema.parse(req.body);
    sendSuccess(res, await termService.update(getIdParam(req), input, req.file));
  },

  async remove(req: Request, res: Response) {
    await termService.remove(getIdParam(req));
    sendSuccess(res, null);
  },
};
