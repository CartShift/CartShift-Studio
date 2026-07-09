import { CLIENT_STATUS_MAP, type RequestStatus } from '@/lib/types/portal';

export const REQUEST_STATUS_KEYS = {
  draft: 'requests.status.draft',
  new: 'requests.status.new',
  needs_info: 'requests.status.needs_info',
  quoted: 'requests.status.quoted',
  changes_requested: 'requests.status.changes_requested',
  accepted: 'requests.status.accepted',
  declined: 'requests.status.declined',
  queued: 'requests.status.queued',
  in_progress: 'requests.status.in_progress',
  in_review: 'requests.status.in_review',
  delivered: 'requests.status.delivered',
  paid: 'requests.status.paid',
  closed: 'requests.status.closed',
  canceled: 'requests.status.canceled',
  expired: 'requests.status.expired',
} as const;

export type RequestStatusTranslationKey =
  (typeof REQUEST_STATUS_KEYS)[keyof typeof REQUEST_STATUS_KEYS];

export const CLIENT_STATUS_KEYS = {
  submitted: 'requests.clientStatus.submitted',
  in_progress: 'requests.clientStatus.in_progress',
  in_review: 'requests.clientStatus.in_review',
  completed: 'requests.clientStatus.completed',
} as const;

export type ClientStatusTranslationKey =
  (typeof CLIENT_STATUS_KEYS)[keyof typeof CLIENT_STATUS_KEYS];

export const REQUEST_PRIORITY_KEYS = {
  low: 'requests.priority.low',
  normal: 'requests.priority.normal',
  high: 'requests.priority.high',
  urgent: 'requests.priority.urgent',
} as const;

export type RequestPriorityTranslationKey =
  (typeof REQUEST_PRIORITY_KEYS)[keyof typeof REQUEST_PRIORITY_KEYS];

export const REQUEST_TYPE_KEYS = {
  feature: 'requests.type.feature',
  bug: 'requests.type.bug',
  optimization: 'requests.type.optimization',
  content: 'requests.type.content',
  design: 'requests.type.design',
  other: 'requests.type.other',
} as const;

export type RequestTypeTranslationKey =
  (typeof REQUEST_TYPE_KEYS)[keyof typeof REQUEST_TYPE_KEYS];

export const AGENCY_CLIENT_BADGE_KEYS = {
  active: 'agency.clients.badge.active',
  inactive: 'agency.clients.badge.inactive',
  suspended: 'agency.clients.badge.suspended',
  pendingInvitation: 'agency.clients.badge.pendingInvitation',
} as const;

export type AgencyClientBadgeTranslationKey =
  (typeof AGENCY_CLIENT_BADGE_KEYS)[keyof typeof AGENCY_CLIENT_BADGE_KEYS];

export const AGENCY_CLIENT_PLAN_KEYS = {
  free: 'agency.clients.plans.free',
  pro: 'agency.clients.plans.pro',
  enterprise: 'agency.clients.plans.enterprise',
} as const;

export type AgencyClientPlanTranslationKey =
  (typeof AGENCY_CLIENT_PLAN_KEYS)[keyof typeof AGENCY_CLIENT_PLAN_KEYS];

export const CONSULTATION_STATUS_KEYS = {
  scheduled: 'consultations.status.scheduled',
  completed: 'consultations.status.completed',
  canceled: 'consultations.status.canceled',
  no_show: 'consultations.status.no_show',
} as const;

export type ConsultationStatusTranslationKey =
  (typeof CONSULTATION_STATUS_KEYS)[keyof typeof CONSULTATION_STATUS_KEYS];

export const TESTIMONIAL_STATUS_KEYS = {
  pending: 'agency.testimonials.status.pending',
  approved: 'agency.testimonials.status.approved',
  rejected: 'agency.testimonials.status.rejected',
} as const;

/** @deprecated Prefer relative keys with `usePortalTranslations()`. */
export function asPortalKey<K extends string>(key: K): `portal.${K}` {
  return `portal.${key}`;
}

export type TestimonialStatusTranslationKey =
  (typeof TESTIMONIAL_STATUS_KEYS)[keyof typeof TESTIMONIAL_STATUS_KEYS];

export const PORTAL_ROLE_KEYS = {
  owner: 'roles.owner',
  admin: 'roles.admin',
  sales_manager: 'roles.sales_manager',
  developer: 'roles.developer',
  member: 'roles.member',
  viewer: 'roles.viewer',
} as const;

export type PortalRoleTranslationKey = (typeof PORTAL_ROLE_KEYS)[keyof typeof PORTAL_ROLE_KEYS];

export const ACTIVITY_ACTION_KEYS = {
  created_request: 'created_request',
  assigned_request: 'assigned_request',
  added_pricing: 'added_pricing',
  accepted_quote: 'accepted_quote',
  declined_quote: 'declined_quote',
  requested_revision: 'requested_revision',
  started_work: 'started_work',
  paid_request: 'paid_request',
  added_comment: 'added_comment',
  added_attachment: 'added_attachment',
  scheduled_consultation: 'scheduled_consultation',
  completed_consultation: 'completed_consultation',
  canceled_consultation: 'canceled_consultation',
  marked_no_show: 'marked_no_show',
  marked_as_free: 'marked_as_free',
  status_changed: 'status_changed',
} as const;

export type ActivityActionTranslationKey =
  (typeof ACTIVITY_ACTION_KEYS)[keyof typeof ACTIVITY_ACTION_KEYS];

export const SHOPIFY_ACCESS_STATUS_KEYS = {
  pending: 'status.pending',
  requested: 'status.requested',
  connected: 'status.connected',
  revoked: 'status.revoked',
} as const;

export type ShopifyAccessStatusTranslationKey =
  (typeof SHOPIFY_ACCESS_STATUS_KEYS)[keyof typeof SHOPIFY_ACCESS_STATUS_KEYS];

function lookup<T extends Record<string, string>>(
  map: T,
  value: string | undefined,
  fallback: keyof T & string
): T[keyof T] {
  const key = (value?.toLowerCase() || fallback) as keyof T;
  return (map[key] ?? map[fallback as keyof T]) as T[keyof T];
}

export function getStatusTranslationKey(
  status: string | undefined
): RequestStatusTranslationKey {
  return lookup(REQUEST_STATUS_KEYS, status, 'new');
}

export function getClientStatusTranslationKey(
  status: string | undefined,
  isAgencyStatus: boolean = false
): ClientStatusTranslationKey {
  if (isAgencyStatus) {
    const mapped = CLIENT_STATUS_MAP[status as RequestStatus];
    return lookup(CLIENT_STATUS_KEYS, mapped, 'submitted');
  }
  return lookup(CLIENT_STATUS_KEYS, status, 'submitted');
}

export function getPriorityTranslationKey(
  priority: string | undefined
): RequestPriorityTranslationKey {
  return lookup(REQUEST_PRIORITY_KEYS, priority, 'normal');
}

export function getTypeTranslationKey(type: string | undefined): RequestTypeTranslationKey {
  return lookup(REQUEST_TYPE_KEYS, type, 'other');
}

export function getAgencyClientBadgeKey(
  status: string | undefined
): AgencyClientBadgeTranslationKey {
  if (status && status in AGENCY_CLIENT_BADGE_KEYS) {
    return AGENCY_CLIENT_BADGE_KEYS[status as keyof typeof AGENCY_CLIENT_BADGE_KEYS];
  }
  return AGENCY_CLIENT_BADGE_KEYS.inactive;
}

export function getAgencyClientPlanKey(
  plan: string | undefined
): AgencyClientPlanTranslationKey {
  if (plan && plan in AGENCY_CLIENT_PLAN_KEYS) {
    return AGENCY_CLIENT_PLAN_KEYS[plan as keyof typeof AGENCY_CLIENT_PLAN_KEYS];
  }
  return AGENCY_CLIENT_PLAN_KEYS.free;
}

export function getConsultationStatusKey(
  status: string | undefined
): ConsultationStatusTranslationKey {
  return lookup(CONSULTATION_STATUS_KEYS, status, 'scheduled');
}

export function getTestimonialStatusKey(
  status: string | undefined
): TestimonialStatusTranslationKey {
  if (status && status in TESTIMONIAL_STATUS_KEYS) {
    return TESTIMONIAL_STATUS_KEYS[status as keyof typeof TESTIMONIAL_STATUS_KEYS];
  }
  return TESTIMONIAL_STATUS_KEYS.pending;
}

export function getPortalRoleKey(role: string | undefined): PortalRoleTranslationKey {
  return lookup(PORTAL_ROLE_KEYS, role, 'member');
}

export function getActivityActionKey(
  action: string | undefined
): ActivityActionTranslationKey | null {
  if (!action) return null;
  const key = action.toLowerCase();
  if (key in ACTIVITY_ACTION_KEYS) {
    return ACTIVITY_ACTION_KEYS[key as keyof typeof ACTIVITY_ACTION_KEYS];
  }
  return null;
}

export function getShopifyAccessStatusKey(
  status: string | undefined
): ShopifyAccessStatusTranslationKey {
  if (status && status in SHOPIFY_ACCESS_STATUS_KEYS) {
    return SHOPIFY_ACCESS_STATUS_KEYS[status as keyof typeof SHOPIFY_ACCESS_STATUS_KEYS];
  }
  return SHOPIFY_ACCESS_STATUS_KEYS.pending;
}

/** @deprecated Use REQUEST_STATUS_KEYS + usePortalTranslations(). */
export const PORTAL_REQUEST_STATUS_KEYS = {
  draft: 'portal.requests.status.draft',
  new: 'portal.requests.status.new',
  needs_info: 'portal.requests.status.needs_info',
  quoted: 'portal.requests.status.quoted',
  changes_requested: 'portal.requests.status.changes_requested',
  accepted: 'portal.requests.status.accepted',
  declined: 'portal.requests.status.declined',
  queued: 'portal.requests.status.queued',
  in_progress: 'portal.requests.status.in_progress',
  in_review: 'portal.requests.status.in_review',
  delivered: 'portal.requests.status.delivered',
  paid: 'portal.requests.status.paid',
  closed: 'portal.requests.status.closed',
  canceled: 'portal.requests.status.canceled',
  expired: 'portal.requests.status.expired',
} as const;

/** @deprecated Use CLIENT_STATUS_KEYS + usePortalTranslations(). */
export const PORTAL_CLIENT_STATUS_KEYS = {
  submitted: 'portal.requests.clientStatus.submitted',
  in_progress: 'portal.requests.clientStatus.in_progress',
  in_review: 'portal.requests.clientStatus.in_review',
  completed: 'portal.requests.clientStatus.completed',
} as const;

/** @deprecated Use getStatusTranslationKey + usePortalTranslations(). */
export function getPortalStatusTranslationKey(status: string | undefined) {
  return lookup(PORTAL_REQUEST_STATUS_KEYS, status, 'new');
}

/** @deprecated Use getClientStatusTranslationKey + usePortalTranslations(). */
export function getPortalClientStatusTranslationKey(
  status: string | undefined,
  isAgencyStatus: boolean = false
) {
  if (isAgencyStatus) {
    const mapped = CLIENT_STATUS_MAP[status as RequestStatus];
    return lookup(PORTAL_CLIENT_STATUS_KEYS, mapped, 'submitted');
  }
  return lookup(PORTAL_CLIENT_STATUS_KEYS, status, 'submitted');
}

export const PORTAL_ACTIVITY_ACTION_KEYS = {
  created_request: 'activity.actions.created_request',
  assigned_request: 'activity.actions.assigned_request',
  added_pricing: 'activity.actions.added_pricing',
  accepted_quote: 'activity.actions.accepted_quote',
  declined_quote: 'activity.actions.declined_quote',
  requested_revision: 'activity.actions.requested_revision',
  started_work: 'activity.actions.started_work',
  paid_request: 'activity.actions.paid_request',
  added_comment: 'activity.actions.added_comment',
  added_attachment: 'activity.actions.added_attachment',
  scheduled_consultation: 'activity.actions.scheduled_consultation',
  completed_consultation: 'activity.actions.completed_consultation',
  canceled_consultation: 'activity.actions.canceled_consultation',
  marked_no_show: 'activity.actions.marked_no_show',
  marked_as_free: 'activity.actions.marked_as_free',
  status_changed: 'activity.actions.status_changed',
} as const;

export function getPortalActivityActionKey(action: string | undefined) {
  if (!action) return null;
  const key = action.toLowerCase();
  if (key in PORTAL_ACTIVITY_ACTION_KEYS) {
    return PORTAL_ACTIVITY_ACTION_KEYS[key as keyof typeof PORTAL_ACTIVITY_ACTION_KEYS];
  }
  return null;
}

export const PORTAL_INDUSTRY_KEYS = {
  ecommerce: 'industries.ecommerce',
  saas: 'industries.saas',
  agency: 'industries.agency',
  education: 'industries.education',
  healthcare: 'industries.healthcare',
  other: 'industries.other',
} as const;

export type PortalIndustryTranslationKey =
  (typeof PORTAL_INDUSTRY_KEYS)[keyof typeof PORTAL_INDUSTRY_KEYS];

export function getPortalIndustryKey(industry: string): PortalIndustryTranslationKey {
  if (industry in PORTAL_INDUSTRY_KEYS) {
    return PORTAL_INDUSTRY_KEYS[industry as keyof typeof PORTAL_INDUSTRY_KEYS];
  }
  return PORTAL_INDUSTRY_KEYS.other;
}
