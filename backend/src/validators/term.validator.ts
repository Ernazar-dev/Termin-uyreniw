import { z } from 'zod';
import { idSchema, optionalIdQuery, optionalText, paginationQuerySchema, requiredText } from './common.validator';

export const termSchema = z.object({
  chapterId: idSchema,
  name: requiredText('Termin atı', 2, 150),
  definition: requiredText('Mánisi', 5, 3000),
  example: optionalText(2000),
  /** "true" when the teacher removed an existing image without uploading a new one */
  removeImage: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

export const termQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  classId: optionalIdQuery,
  chapterId: optionalIdQuery,
});

export type TermInput = z.infer<typeof termSchema>;
export type TermQuery = z.infer<typeof termQuerySchema>;
