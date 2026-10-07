import type { Request, Response } from 'express';
import { resultService } from '../services/result.service';
import { getAuthUser, getIdParam } from '../utils/request';
import { sendSuccess } from '../utils/response';
import { resultQuerySchema } from '../validators/result.validator';

export const resultController = {
  async list(req: Request, res: Response) {
    sendSuccess(res, await resultService.list(resultQuerySchema.parse(req.query), getAuthUser(req)));
  },

  async listByStudent(req: Request, res: Response) {
    const query = { ...resultQuerySchema.parse(req.query), studentId: getIdParam(req) };
    sendSuccess(res, await resultService.list(query, getAuthUser(req)));
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await resultService.getById(getIdParam(req), getAuthUser(req)));
  },

  async remove(req: Request, res: Response) {
    await resultService.remove(getIdParam(req));
    sendSuccess(res, null);
  },
};
