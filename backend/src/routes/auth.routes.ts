import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';

export const authRouter = Router();

authRouter.post('/login', authLimiter, authController.login);
authRouter.post('/register', authLimiter, authController.register);
authRouter.get('/me', authenticate, authController.me);
