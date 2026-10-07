import fs from 'fs/promises';
import path from 'path';
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from '../config/constants';

export const toPublicImagePath = (filename: string) => `${UPLOADS_URL_PREFIX}/${filename}`;

/** Removes an uploaded file referenced by its public path. Missing files are ignored. */
export const removeUploadedFile = async (publicPath?: string | null) => {
  if (!publicPath?.startsWith(`${UPLOADS_URL_PREFIX}/`)) return;
  const filename = path.basename(publicPath);
  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
};
