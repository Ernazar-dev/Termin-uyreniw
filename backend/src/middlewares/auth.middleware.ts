import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

const BEARER_PREFIX = 'Bearer ';

/** Public reading remains available even when a stored session has expired. */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (header?.startsWith(BEARER_PREFIX)) {
    try { req.user = verifyToken(header.slice(BEARER_PREFIX.length)); } catch { req.user = undefined; }
  }
  return next();
};

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) {
    return next(ApiError.unauthorized());
  }

  try {
    req.user = verifyToken(header.slice(BEARER_PREFIX.length));
    return next();
  } catch {
    return next(ApiError.unauthorized('Sessiya múddeti tawsıldı. Qaytadan kiriń'));
  }
};

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };
