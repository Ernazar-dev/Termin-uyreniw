import { z } from 'zod';
import { requiredText } from './common.validator';

export const classSchema = z.object({
  name: requiredText('Klass atı', 1, 50),
  /** Normally omitted: the position is assigned automatically. */
  order: z.coerce.number().int().min(1).optional(),
});

export type ClassInput = z.infer<typeof classSchema>;
