import { z } from 'zod';

export const questionTypeEnum = z.enum([
  'text',
  'textarea',
  'radio',
  'checkbox',
  'dropdown',
]);

const choiceBasedTypes = ['radio', 'checkbox', 'dropdown'] as const;

export const questionSchema = z
  .object({
    q_id: z
      .string()
      .trim()
      .min(1, { message: 'Question ID (q_id) is required' }),
    type: questionTypeEnum,
    label: z
      .string()
      .trim()
      .min(1, { message: 'Question label is required' }),
    required: z.boolean().default(false),
    options: z
      .array(z.string().trim().min(1, { message: 'Option text cannot be empty' }))
      .optional(),
  })
  .superRefine((data, ctx) => {
    const isChoiceType = choiceBasedTypes.includes(
      data.type as (typeof choiceBasedTypes)[number]
    );

    if (isChoiceType) {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Options are required for question type '${data.type}' and must contain at least one option`,
          path: ['options'],
        });
      }
    }
  });

export const createFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Form title is required' })
    .max(255, { message: 'Title must not exceed 255 characters' }),
  description: z.string().trim().optional().default(''),
  is_active: z.boolean().optional().default(true),
  questions: z
    .array(questionSchema)
    .min(1, { message: 'At least one question is required' })
    .superRefine((questions, ctx) => {
      const ids = new Set<string>();
      questions.forEach((q, index) => {
        if (ids.has(q.q_id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate question ID detected: '${q.q_id}' at index ${index}`,
            path: [index, 'q_id'],
          });
        }
        ids.add(q.q_id);
      });
    }),
});

export const updateFormSchema = createFormSchema.partial();

export type CreateFormSchemaInput = z.infer<typeof createFormSchema>;
export type UpdateFormSchemaInput = z.infer<typeof updateFormSchema>;
export type QuestionSchemaInput = z.infer<typeof questionSchema>;
