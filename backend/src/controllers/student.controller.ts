import type { Request, Response } from 'express';
import { studentService } from '../services/student.service';
import { getIdParam } from '../utils/request';
import { sendCreated, sendSuccess } from '../utils/response';
import { createStudentSchema, studentQuerySchema, updateStudentSchema } from '../validators/student.validator';

export const studentController = {
  async list(req: Request, res: Response) {
    sendSuccess(res, await studentService.list(studentQuerySchema.parse(req.query)));
  },

  async getById(req: Request, res: Response) {
    sendSuccess(res, await studentService.getById(getIdParam(req)));
  },

  async create(req: Request, res: Response) {
    sendCreated(res, await studentService.create(createStudentSchema.parse(req.body)));
  },

  async update(req: Request, res: Response) {
    sendSuccess(res, await studentService.update(getIdParam(req), updateStudentSchema.parse(req.body)));
  },

  async remove(req: Request, res: Response) {
    await studentService.remove(getIdParam(req));
    sendSuccess(res, null);
  },
};
