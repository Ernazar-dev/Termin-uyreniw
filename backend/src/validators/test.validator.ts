import { z } from 'zod';
import { OPTIONS_MAX, OPTIONS_MIN } from '../config/constants';
import { idSchema, optionalIdQuery, optionalText, optionsSchema, requiredText } from './common.validator';

const questionSchema = z.object({
  question: requiredText('Soraw', 3, 1000),
  options: optionsSchema,
});

export const testSchema = z.object({
  chapterId: idSchema,
  title: requiredText('Test atı', 3, 150),
  description: optionalText(1000),
  questions: z.array(questionSchema).min(1, 'Keminde bir soraw kerek').max(100),
});

/** Letters used for the answer sheet of file based tests: A, B, C ... */
export const ANSWER_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** Multipart fields of a test made from a PDF / Word sheet; the key is sent as a JSON array of letters. */
export const fileTestSchema = z
  .object({
    chapterId: idSchema,
    title: requiredText('Test atı', 3, 150),
    description: optionalText(1000),
    optionCount: z.coerce.number().int().min(OPTIONS_MIN).max(OPTIONS_MAX),
    answerKey: z
      .string({ required_error: 'Durıs juwaplar kiritiliwi shárt' })
      .transform((value, context) => {
        try {
          const parsed: unknown = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim().toUpperCase());
        } catch {
          // falls through to the issue below
        }
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Durıs juwaplar formatı qáte' });
        return z.NEVER;
      })
      .pipe(z.array(z.string()).min(1, 'Keminde bir soraw kerek').max(100)),
  })
  .superRefine((data, context) => {
    const allowed = ANSWER_LETTERS.slice(0, data.optionCount) as readonly string[];
    data.answerKey.forEach((letter, index) => {
      if (!allowed.includes(letter)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['answerKey'],
          message: `${index + 1}-sorawdıń juwabı ${allowed[0]}–${allowed[allowed.length - 1]} aralıǵında bolıwı kerek`,
        });
      }
    });
  });

export const testQuerySchema = z.object({
  chapterId: optionalIdQuery,
  classId: optionalIdQuery,
});

export const submitTestSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: idSchema,
        optionId: idSchema.nullable(),
      }),
    )
    .max(100),
});

export type TestInput = z.infer<typeof testSchema>;
export type FileTestInput = z.infer<typeof fileTestSchema>;
export type TestQuery = z.infer<typeof testQuerySchema>;
export type SubmitTestInput = z.infer<typeof submitTestSchema>;
