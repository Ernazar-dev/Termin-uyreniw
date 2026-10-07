import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { readLegacyTestDocument } from '../services/document.service';
import { questionsFromKey, testService } from '../services/test.service';
import { ApiError } from '../utils/ApiError';
import { removeUploadedFile } from '../utils/file';
import { getAuthUser, getIdParam } from '../utils/request';
import { sendCreated, sendSuccess } from '../utils/response';
import { fileTestSchema, submitTestSchema, testQuerySchema, testSchema } from '../validators/test.validator';

const toTestInput = (body: unknown) => {
  const { answerKey, optionCount, ...rest } = fileTestSchema.parse(body);
  return { ...rest, questions: questionsFromKey({ answerKey, optionCount }) };
};

/** Never leave an orphaned upload behind when validation or saving fails. */
const discardOnFailure = async <T>(req: Request, work: () => Promise<T>) => {
  try {
    return await work();
  } catch (error) {
    if (req.file) await removeUploadedFile(`/uploads/${req.file.filename}`).catch(() => undefined);
    throw error;
  }
};

export const testController = {
  async document(req: Request, res: Response) {
    sendSuccess(res, await readLegacyTestDocument(getIdParam(req)));
  },
  async list(req: Request, res: Response) {
    sendSuccess(res, await testService.list(testQuerySchema.parse(req.query), req.user));
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await testService.getById(getIdParam(req), req.user?.role ?? Role.STUDENT));
  },

  async create(req: Request, res: Response) {
    sendCreated(res, await testService.create(testSchema.parse(req.body), getAuthUser(req).id));
  },

  async update(req: Request, res: Response) {
    sendSuccess(res, await testService.update(getIdParam(req), testSchema.parse(req.body)));
  },

  async createFromFile(req: Request, res: Response) {
    if (!req.file) throw ApiError.badRequest('PDF yamasa Word fayl júklep qoyıń');
    const file = req.file;
    sendCreated(res, await discardOnFailure(req, () => testService.create(toTestInput(req.body), getAuthUser(req).id, file)));
  },

  async updateFromFile(req: Request, res: Response) {
    const id = getIdParam(req);
    const file = req.file;
    sendSuccess(
      res,
      await discardOnFailure(req, async () => {
        await testService.requireSheet(id, file);
        return testService.update(id, toTestInput(req.body), file);
      }),
    );
  },

  async remove(req: Request, res: Response) {
    await testService.remove(getIdParam(req));
    sendSuccess(res, null);
  },

  async submit(req: Request, res: Response) {
    const input = submitTestSchema.parse(req.body);
    sendCreated(res, await testService.submit(getIdParam(req), getAuthUser(req).id, input));
  },
};
