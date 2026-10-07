import { z } from 'zod';
import { GameType } from '@prisma/client';
import { idSchema, optionalIdQuery, optionsSchema, requiredText } from './common.validator';

export const BLANK_MARKER = '___';

export const gameSchema = z
  .object({
    chapterId: idSchema,
    termId: idSchema.optional().nullable(),
    type: z.nativeEnum(GameType),
    question: requiredText('Soraw', 5, 1000),
    options: optionsSchema,
  })
  .refine((data) => data.type !== GameType.FILL_BLANK || data.question.includes(BLANK_MARKER), {
    message: `Bos orın ushın sorawda "${BLANK_MARKER}" belgisi bolıwı kerek`,
    path: ['question'],
  });

export const gameQuerySchema = z.object({
  chapterId: optionalIdQuery,
  termId: optionalIdQuery,
  classId: optionalIdQuery,
  type: z.nativeEnum(GameType).optional(),
});

export const gameCheckSchema = z.object({ optionId: idSchema });

export type GameInput = z.infer<typeof gameSchema>;
export type GameQuery = z.infer<typeof gameQuerySchema>;
