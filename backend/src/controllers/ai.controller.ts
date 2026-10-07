import type { Request, Response } from 'express';
import { aiService } from '../services/ai/ai.service';
import { getAuthUser } from '../utils/request';
import { sendSuccess } from '../utils/response';
import { askSchema } from '../validators/ai.validator';

export const aiController = {
  async ask(req: Request, res: Response) {
    const { question } = askSchema.parse(req.body);
    sendSuccess(res, await aiService.ask(question, getAuthUser(req).id));
  },
};
