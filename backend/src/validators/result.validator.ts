import { z } from 'zod';
import { optionalIdQuery, paginationQuerySchema } from './common.validator';

export const resultQuerySchema = paginationQuerySchema.extend({
  classId: optionalIdQuery,
  chapterId: optionalIdQuery,
  studentId: optionalIdQuery,
  testId: optionalIdQuery,
});

export type ResultQuery = z.infer<typeof resultQuerySchema>;
