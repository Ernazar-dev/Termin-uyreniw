import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { getAuthUser } from '../utils/request';
import { sendCreated, sendSuccess } from '../utils/response';
import { loginSchema, registerSchema } from '../validators/auth.validator';

export const authController = {
  async login(req: Request, res: Response) {
    sendSuccess(res, await authService.login(loginSchema.parse(req.body)));
  },

  async register(req: Request, res: Response) {
    sendCreated(res, await authService.register(registerSchema.parse(req.body)));
  },

  async me(req: Request, res: Response) {
    sendSuccess(res, await authService.me(getAuthUser(req).id));
  },
};
