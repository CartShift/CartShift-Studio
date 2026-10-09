'use client';

import { RequestForm } from './RequestForm';

/**
 * Compatibility entry point. Keep consumers on the original API while the
 * create and edit flows share the same form and submission implementation.
 */
export function CreateRequestForm({ orgId }: { orgId: string }) {
  return <RequestForm orgId={orgId} mode="create" />;
}
