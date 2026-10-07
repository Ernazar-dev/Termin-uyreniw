import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_TEST_FILE_EXTENSIONS,
  IMAGE_MAX_SIZE_BYTES,
  TEST_FILE_MAX_SIZE_BYTES,
  UPLOADS_DIR,
} from '../config/constants';
import { ApiError } from '../utils/ApiError';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const isAllowed = (file: Express.Multer.File) => {
  const ext = path.extname(file.originalname).toLowerCase();
  return (
    (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype) &&
    (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext)
  );
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: IMAGE_MAX_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (isAllowed(file)) return cb(null, true);
    return cb(ApiError.badRequest('Tek ǵana jpg, jpeg, png yamasa webp súwretler qabıl etiledi'));
  },
}).single('image');

const isAllowedTestFile = (file: Express.Multer.File) =>
  (ALLOWED_TEST_FILE_EXTENSIONS as readonly string[]).includes(path.extname(file.originalname).toLowerCase());

/** Ready-made test sheet: PDF or Word document. */
export const uploadTestFile = multer({
  storage,
  limits: { fileSize: TEST_FILE_MAX_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    // Browsers send file names as latin1; keep the original (e.g. Karakalpak letters) readable
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    if (isAllowedTestFile(file)) return cb(null, true);
    return cb(ApiError.badRequest('Tek ǵana PDF yamasa Word (doc, docx) fayl qabıl etiledi'));
  },
}).single('file');
