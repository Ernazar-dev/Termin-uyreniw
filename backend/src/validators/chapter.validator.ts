import { z } from 'zod';
import { idSchema, optionalIdQuery, optionalText, requiredText } from './common.validator';

export const chapterSchema = z
  .object({
    classId: idSchema,
    title: requiredText('Bap atı', 1, 150),
    description: optionalText(1000),
    startTopic: z.coerce.number().int().min(1),
    endTopic: z.coerce.number().int().min(1),
    /** Normally omitted: the position inside the class is assigned automatically. */
    order: z.coerce.number().int().min(1).optional(),
  })
  .refine((data) => data.endTopic >= data.startTopic, {
    message: 'Sońǵı tema baslanǵısh temadan kishi bolmawı kerek',
    path: ['endTopic'],
  });

export const chapterQuerySchema = z.object({ classId: optionalIdQuery });

export type ChapterInput = z.infer<typeof chapterSchema>;
