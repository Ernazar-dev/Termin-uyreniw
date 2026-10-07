import path from 'node:path';
import WordExtractor from 'word-extractor';
import { UPLOADS_DIR } from '../config/constants';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export const readLegacyTestDocument = async (id: number) => {
  const test = await prisma.test.findUnique({ where: { id }, select: { fileUrl: true } });
  if (!test?.fileUrl) throw ApiError.notFound('Test faylı tabılmadı');
  if (path.extname(test.fileUrl).toLowerCase() !== '.doc') throw ApiError.badRequest('Bul Word DOC faylı emes');
  try {
    const document = await new WordExtractor().extract(path.join(UPLOADS_DIR, path.basename(test.fileUrl)));
    return { text: document.getBody() };
  } catch {
    throw ApiError.badRequest('Word faylın oqıw múmkin bolmadı. Oqıtıwshıdan fayldı tekseriwdi sorań.');
  }
};
