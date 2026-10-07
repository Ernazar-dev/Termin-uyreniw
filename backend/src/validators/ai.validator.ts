import { z } from 'zod';
import { requiredText } from './common.validator';

export const askSchema = z.object({
  question: requiredText('Soraw', 2, 500),
});

export type AskInput = z.infer<typeof askSchema>;
