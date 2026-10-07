import path from 'path';

export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
export const UPLOADS_URL_PREFIX = '/uploads';

export const IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const TEST_FILE_MAX_SIZE_BYTES = 15 * 1024 * 1024;
export const ALLOWED_TEST_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

export const BCRYPT_ROUNDS = 10;

export const OPTIONS_MIN = 2;
export const OPTIONS_MAX = 6;
