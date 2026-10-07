import { z } from 'zod';
import { idSchema, requiredText } from './common.validator';

export const usernameSchema = z
  .string({ required_error: 'Kiriw atı kiritiliwi shárt' })
  .trim()
  .min(3, 'Kiriw atı keminde 3 belgiden ibarat bolıwı kerek')
  .max(32, 'Kiriw atı kóbi menen 32 belgi bolıwı kerek')
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Kiriw atı: latın háripleri, sanlar, noqta, sızıqsha yamasa astınǵı sızıq');

export const passwordSchema = z
  .string({ required_error: 'Parol kiritiliwi shárt' })
  .min(6, 'Parol keminde 6 belgiden ibarat bolıwı kerek')
  .max(100);

export const loginSchema = z.object({
  login: usernameSchema,
  password: z.string({ required_error: 'Parol kiritiliwi shárt' }).min(1, 'Parol kiritiliwi shárt'),
});

export const registerSchema = z.object({
  fullName: requiredText('Tolıq atı', 3, 100),
  login: usernameSchema,
  password: passwordSchema,
  classId: idSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
