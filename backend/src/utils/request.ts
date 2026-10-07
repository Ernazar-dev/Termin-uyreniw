import type { Request } from 'express';
import type { AuthUser } from '../types';
import { idParamSchema } from '../validators/common.validator';
import { ApiError } from './ApiError';

export const getIdParam = (req: Request) => idParamSchema.parse(req.params).id;

/** Only call on routes protected by `authenticate`. */
export const getAuthUser = (req: Request): AuthUser => {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
};
