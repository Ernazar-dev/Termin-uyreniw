import type { Request, Response } from 'express';
import { statsService } from '../services/stats.service';
import { getAuthUser } from '../utils/request';
import { sendSuccess } from '../utils/response';

export const statsController = {
  async teacher(_req: Request, res: Response) {
    sendSuccess(res, await statsService.teacher());
  },

  async student(req: Request, res: Response) {
    sendSuccess(res, await statsService.student(getAuthUser(req).id));
  },
};
