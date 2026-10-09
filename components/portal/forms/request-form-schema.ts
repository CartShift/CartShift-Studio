import { z } from 'zod';

/**
 * A single validation contract for creating and editing client requests.
 * Localized messages are supplied by callers; no locale-specific imports leak
 * into the domain of request form values.
 */
export interface RequestFormValidationMessages {
  titleShort: string;
  titleLong: string;
  descriptionShort: string;
  typeRequired: string;
}

export function createRequestFormSchema(messages: RequestFormValidationMessages) {
  return z.object({
    title: z.string().min(5, messages.titleShort).max(200, messages.titleLong),
    description: z.string().min(20, messages.descriptionShort),
    type: z.enum(['feature', 'bug', 'optimization', 'content', 'design', 'other'], {
      message: messages.typeRequired,
    }),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  });
}

export type RequestFormData = z.infer<ReturnType<typeof createRequestFormSchema>>;
