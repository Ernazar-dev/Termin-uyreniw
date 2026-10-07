import { z } from 'zod';
import { usernameSchema, passwordSchema } from './auth.validator';
import { idSchema, optionalIdQuery, paginationQuerySchema, requiredText } from './common.validator';

export const createStudentSchema = z.object({
  fullName: requiredText('Tolıq atı', 3, 100),
  login: usernameSchema,
  password: passwordSchema,
  classId: idSchema,
});

export const updateStudentSchema = createStudentSchema.extend({
  password: passwordSchema.optional().or(z.literal('').transform(() => undefined)),
});

export const studentQuerySchema = paginationQuerySchema.extend({
  classId: optionalIdQuery,
  search: z.string().trim().max(100).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;
