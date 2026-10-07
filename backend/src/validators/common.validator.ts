import { z } from 'zod';
import '../config/validation-locale';
import { OPTIONS_MAX, OPTIONS_MIN } from '../config/constants';

export const idSchema = z.coerce.number().int().positive('ID qáte');
export const idParamSchema = z.object({ id: idSchema });

export const optionalIdQuery = z.coerce.number().int().positive().optional();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export const requiredText = (label: string, min = 1, max = 255) =>
  z
    .string({ required_error: `${label} kiritiliwi shárt` })
    .trim()
    .min(min, min > 1 ? `${label} keminde ${min} belgiden ibarat bolıwı kerek` : `${label} kiritiliwi shárt`)
    .max(max, `${label} ${max} belgiden aspawı kerek`);

/** Empty strings from forms become null so optional columns stay clean. */
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null));

export const optionSchema = z.object({
  text: requiredText('Variant', 1, 500),
  isCorrect: z.boolean().default(false),
});

/** A list of answer options with exactly one correct answer. */
export const optionsSchema = z
  .array(optionSchema)
  .min(OPTIONS_MIN, `Keminde ${OPTIONS_MIN} variant kerek`)
  .max(OPTIONS_MAX, `Kóbi menen ${OPTIONS_MAX} variant boladı`)
  .refine((options) => options.filter((option) => option.isCorrect).length === 1, {
    message: 'Tek bir durıs juwap belgileniwi kerek',
  })
  .refine(
    (options) => new Set(options.map((option) => option.text.toLowerCase())).size === options.length,
    { message: 'Variantlar qaytalanbawı kerek' },
  );

export type OptionInput = z.infer<typeof optionSchema>;
