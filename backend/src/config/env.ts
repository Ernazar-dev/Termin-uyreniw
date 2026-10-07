import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  AI_API_KEY: z.string().optional().default(''),
  AI_BASE_URL: z.string().default('https://generativelanguage.googleapis.com/v1beta/openai'),
  AI_MODEL: z.string().default('gemini-3.8-flash'),
  /** Comma-separated models tried in order when the primary model is overloaded. */
  AI_FALLBACK_MODELS: z
    .string()
    .optional()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean),
    ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
