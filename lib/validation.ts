import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  interest: z.string().optional(),
  message: z.string().max(5000, "Message must be less than 5000 characters").optional(),
  company: z.string().max(200, "Company name must be less than 200 characters").optional(),
  projectType: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export function validateContactForm(data: unknown): { success: true; data: ContactFormData } | { success: false; errors: z.ZodError } {
  const result = contactFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

export const newsletterSubscriptionSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type NewsletterSubscriptionData = z.infer<typeof newsletterSubscriptionSchema>;

export function validateNewsletterSubscription(data: unknown): { success: true; data: NewsletterSubscriptionData } | { success: false; errors: z.ZodError } {
  const result = newsletterSubscriptionSchema.safeParse(data);  if (result.success) {
    return { success: true, data: result.data };
  }  return { success: false, errors: result.error };
}
