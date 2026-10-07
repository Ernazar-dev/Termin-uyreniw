import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { catalogCache, invalidateCatalogOnWrite } from '../middlewares/catalogCache.middleware';
import { authRouter } from './auth.routes';
import { testController } from '../controllers/test.controller';
import { gameController } from '../controllers/game.controller';
import {
  aiRouter,
  chapterRouter,
  classRouter,
  gameRouter,
  resultRouter,
  statsRouter,
  studentRouter,
  termRouter,
  testRouter,
} from './content.routes';

export const apiRouter = Router();

apiRouter.use(invalidateCatalogOnWrite);

apiRouter.get('/health',(_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

apiRouter.use('/auth', authRouter);

// Only catalog reads are public. Every write still requires authentication and a teacher role.
const catalogAccess: typeof authenticate = (req, res, next) =>
  req.method === 'GET' || req.method === 'HEAD'
    ? optionalAuthenticate(req, res, next)
    : authenticate(req, res, next);
// A single term (GET /terms/:id) records student progress, so only lists and class/chapter data are cached.
const cacheCatalog = catalogCache();
const cacheTermList = catalogCache((req) => req.path === '/' || req.path === '');
apiRouter.use('/classes', catalogAccess, cacheCatalog, classRouter);
apiRouter.use('/chapters', catalogAccess, cacheCatalog, chapterRouter);
apiRouter.use('/terms', catalogAccess, cacheTermList, termRouter);
// Test list is public; test questions, documents, submissions and teacher writes require authentication.
apiRouter.get('/tests', optionalAuthenticate, testController.list);
apiRouter.get('/tests/:id', authenticate, testController.getById);
apiRouter.get('/tests/:id/document', authenticate, testController.document);
// Practice games do not save scores and can be played without an account.
apiRouter.get('/games', optionalAuthenticate, gameController.list);
apiRouter.get('/games/:id', optionalAuthenticate, gameController.getById);
apiRouter.post('/games/:id/check', optionalAuthenticate, gameController.check);

apiRouter.use(authenticate);
apiRouter.use('/games', gameRouter);
apiRouter.use('/tests', testRouter);
apiRouter.use('/results', resultRouter);
apiRouter.use('/students', studentRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/ai', aiRouter);
