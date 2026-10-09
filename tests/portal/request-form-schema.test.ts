import { describe, expect, it } from 'vitest';
import { createRequestFormSchema } from '@/components/portal/forms/request-form-schema';

const schema = createRequestFormSchema({
  titleShort: 'short title',
  titleLong: 'long title',
  descriptionShort: 'short description',
  typeRequired: 'missing type',
});

const valid = {
  title: 'Build a better checkout',
  description: 'Please improve the checkout experience and payment flow.',
  type: 'feature' as const,
  priority: 'NORMAL' as const,
};

describe('request form shared validation', () => {
  it('accepts the same values in create and edit modes', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('rejects short titles and descriptions with localized errors', () => {
    const result = schema.safeParse({ ...valid, title: 'Hey', description: 'short' });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map(issue => issue.message)).toContain('short title');
    expect(result.error.issues.map(issue => issue.message)).toContain('short description');
  });

  it('rejects invalid request types and priorities', () => {
    expect(schema.safeParse({ ...valid, type: 'billing' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, priority: 'P0' }).success).toBe(false);
  });

  it('enforces the existing 200 character title limit', () => {
    expect(schema.safeParse({ ...valid, title: 'A'.repeat(201) }).success).toBe(false);
  });
});
