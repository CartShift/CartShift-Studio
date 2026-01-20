import { z } from 'zod';

export const RequestStatus = z.enum([
  'NEW',
  'NEEDS_INFO',
  'QUEUED',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DELIVERED',
  'CLOSED',
  'CANCELED',
]);

export const RequestPriority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export type RequestStatus = z.infer<typeof RequestStatus>;
export type RequestPriority = z.infer<typeof RequestPriority>;
