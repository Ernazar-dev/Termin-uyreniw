import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { isProduction } from '../config/env';
import { IMAGE_MAX_SIZE_BYTES, TEST_FILE_MAX_SIZE_BYTES } from '../config/constants';
import { ApiError } from '../utils/ApiError';
import { removeUploadedFile, toPublicImagePath } from '../utils/file';

const PRISMA_ERRORS: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: 'Bunday maǵlıwmat aldınnan bar' },
  P2003: { status: 400, message: 'Baylanıslı maǵlıwmat tabılmadı' },
  P2025: { status: 404, message: 'Maǵlıwmat tabılmadı' },
};

const toApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    const first = err.issues[0];
    return ApiError.badRequest(first?.message ?? 'Maǵlıwmatlar qáte', err.flatten().fieldErrors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && PRISMA_ERRORS[err.code]) {
    const { status, message } = PRISMA_ERRORS[err.code];
    return new ApiError(status, message);
  }

  if (err instanceof multer.MulterError) {
    const maxMb = (err.field === 'file' ? TEST_FILE_MAX_SIZE_BYTES : IMAGE_MAX_SIZE_BYTES) / 1024 / 1024;
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? `Fayl kólemi ${maxMb} MB dan aspawı kerek` : 'Fayl júklewde qátelik';
    return ApiError.badRequest(message);
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return ApiError.badRequest('JSON formatı qáte');
  }

  // body-parser rejections (oversized or malformed bodies) are client errors, not server failures
  const parserError = err as { type?: string } | null;
  if (parserError?.type === 'entity.too.large') return new ApiError(413, 'Jiberilgen maǵlıwmat kólemi artıq úlken');
  if (parserError?.type?.startsWith('entity.') || err instanceof URIError) {
    return ApiError.badRequest('Soraw formatı qáte');
  }

  return new ApiError(500, 'Serverde qátelik júz berdi');
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Marshrut tabılmadı: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = async (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const apiError = toApiError(err);

  if (apiError.statusCode >= 500) {
    console.error(err);
  }

  // Do not keep orphaned uploads when the request failed
  if (req.file) {
    await removeUploadedFile(toPublicImagePath(req.file.filename)).catch(() => undefined);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details && !isProduction ? { errors: apiError.details } : {}),
  });
};
