import { z } from 'zod';

export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
]);

export const answersSchema = z
  .record(z.string(), answerValueSchema)
  .refine(
    (obj) => typeof obj === 'object' && obj !== null && !Array.isArray(obj),
    {
      message: 'Answers must be a key-value object of question IDs to answer values',
    }
  );

export const submitResponseSchema = z.object({
  form_id: z
    .string()
    .trim()
    .min(1, { message: 'Form ID (form_id) is required' }),
  respondent_name: z.string().trim().optional().default('Anonymous'),
  answers: answersSchema,
});

export type SubmitResponseSchemaInput = z.infer<typeof submitResponseSchema>;
export type AnswersSchemaInput = z.infer<typeof answersSchema>;
