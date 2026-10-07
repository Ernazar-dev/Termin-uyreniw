import { Router, type RequestHandler } from 'express';
import { Role } from '@prisma/client';
import { aiController } from '../controllers/ai.controller';
import { chapterController } from '../controllers/chapter.controller';
import { classController } from '../controllers/class.controller';
import { gameController } from '../controllers/game.controller';
import { resultController } from '../controllers/result.controller';
import { statsController } from '../controllers/stats.controller';
import { studentController } from '../controllers/student.controller';
import { termController } from '../controllers/term.controller';
import { testController } from '../controllers/test.controller';
import { authorize } from '../middlewares/auth.middleware';
import { aiLimiter, submitLimiter } from '../middlewares/rateLimit.middleware';
import { uploadImage, uploadTestFile } from '../middlewares/upload.middleware';

const teacherOnly = authorize(Role.TEACHER);
const studentOnly = authorize(Role.STUDENT);

interface CrudController {
  list: RequestHandler;
  getById: RequestHandler;
  create: RequestHandler;
  update: RequestHandler;
  remove: RequestHandler;
}

/** Read endpoints for every signed-in user, write endpoints for teachers only. */
const createCrudRouter = (controller: CrudController, writeMiddlewares: RequestHandler[] = []) => {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', teacherOnly, ...writeMiddlewares, controller.create);
  router.put('/:id', teacherOnly, ...writeMiddlewares, controller.update);
  router.delete('/:id', teacherOnly, controller.remove);
  return router;
};

export const classRouter = createCrudRouter(classController);
export const chapterRouter = createCrudRouter(chapterController);
export const termRouter = createCrudRouter(termController, [uploadImage]);

export const gameRouter = createCrudRouter(gameController);
gameRouter.post('/:id/check', gameController.check);

export const testRouter = createCrudRouter(testController);
testRouter.get('/:id/document', testController.document);
// Ready-made PDF / Word test: the sheet is uploaded, the teacher only enters the answer key
testRouter.post('/from-file', teacherOnly, uploadTestFile, testController.createFromFile);
testRouter.put('/:id/from-file', teacherOnly, uploadTestFile, testController.updateFromFile);
testRouter.post('/:id/submit', studentOnly, submitLimiter, testController.submit);

export const studentRouter = Router();
studentRouter.use(teacherOnly);
studentRouter.get('/', studentController.list);
studentRouter.get('/:id', studentController.getById);
studentRouter.post('/', studentController.create);
studentRouter.put('/:id', studentController.update);
studentRouter.delete('/:id', studentController.remove);

export const resultRouter = Router();
resultRouter.get('/', resultController.list);
resultRouter.get('/student/:id', teacherOnly, resultController.listByStudent);
resultRouter.get('/:id', resultController.getById);
resultRouter.delete('/:id', teacherOnly, resultController.remove);

export const statsRouter = Router();
statsRouter.get('/teacher', teacherOnly, statsController.teacher);
statsRouter.get('/student', studentOnly, statsController.student);

export const aiRouter = Router();
aiRouter.post('/ask', aiLimiter, aiController.ask);
