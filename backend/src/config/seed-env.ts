import dotenv from 'dotenv';
import { z } from 'zod';
import { usernameSchema } from '../validators/auth.validator';

dotenv.config({ quiet: true });

const login = usernameSchema;
export const adminPasswordSchema = z.string().min(6).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
  message: 'Password must not exceed 72 UTF-8 bytes',
});

export const seedEnvSchema = z.object({
  ADMIN_LOGIN: login,
  ADMIN_PASSWORD: adminPasswordSchema,
});

export const getSeedEnv = () => {
  const result = seedEnvSchema.safeParse(process.env);
  if (!result.success) {
    // Only field names are reported; never include supplied credentials.
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid seed configuration: ${fields.join(', ')}. Check backend/.env.`);
  }
  return result.data;
};
