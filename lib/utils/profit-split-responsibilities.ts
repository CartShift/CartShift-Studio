import { Organization } from '@/lib/types/portal';
import { PricingRequest } from '@/lib/types/pricing';
import {
  DEFAULT_PROFIT_SPLIT_PERCENTAGES,
  PROFIT_SPLIT_ROLE,
  ProfitSplitParticipant,
  ProfitSplitRole,
  RequestProfitSplitResponsibility,
} from '@/lib/types/profit-split';

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface ResolveProfitSplitContext {
  responsibleAgencyUserId?: string;
  responsibleAgencyUserName?: string;
  assignedTo?: string;
  assignedToName?: string;
  storedResponsibilities?: RequestProfitSplitResponsibility[];
}

export function createDefaultRequestProfitSplitResponsibilities(): RequestProfitSplitResponsibility[] {
  return (Object.keys(DEFAULT_PROFIT_SPLIT_PERCENTAGES) as ProfitSplitRole[]).map(role => ({
    role,
    userId: '',
    userName: '',
    percentage: DEFAULT_PROFIT_SPLIT_PERCENTAGES[role],
  }));
}

export function resolveRequestProfitSplitResponsibilities(
  context: ResolveProfitSplitContext
): RequestProfitSplitResponsibility[] {
  const storedByRole = new Map(
    (context.storedResponsibilities ?? []).map(item => [item.role, item])
  );

  return (Object.keys(DEFAULT_PROFIT_SPLIT_PERCENTAGES) as ProfitSplitRole[]).map(role => {
    const stored = storedByRole.get(role);
    const percentage = stored?.percentage ?? DEFAULT_PROFIT_SPLIT_PERCENTAGES[role];

    if (role === PROFIT_SPLIT_ROLE.LEAD) {
      return {
        role,
        userId: context.responsibleAgencyUserId?.trim() ?? '',
        userName: context.responsibleAgencyUserName?.trim() ?? '',
        percentage,
        notes: stored?.notes,
      };
    }

    if (role === PROFIT_SPLIT_ROLE.DELIVERY) {
      return {
        role,
        userId: context.assignedTo?.trim() ?? '',
        userName: context.assignedToName?.trim() ?? '',
        percentage,
        notes: stored?.notes,
      };
    }

    return {
      role,
      userId: stored?.userId?.trim() ?? '',
      userName: stored?.userName?.trim() ?? '',
      percentage,
      notes: stored?.notes,
    };
  });
}

/** Persist only request-level overrides (sales, management, percentages). Lead/delivery users are derived. */
export function extractStoredProfitSplitResponsibilities(
  resolved: RequestProfitSplitResponsibility[]
): RequestProfitSplitResponsibility[] {
  return resolved.map(item => {
    if (item.role === PROFIT_SPLIT_ROLE.LEAD || item.role === PROFIT_SPLIT_ROLE.DELIVERY) {
      return {
        role: item.role,
        userId: '',
        userName: '',
        percentage: item.percentage,
        notes: item.notes,
      };
    }
    return {
      role: item.role,
      userId: item.userId.trim(),
      userName: item.userName.trim(),
      percentage: item.percentage,
      notes: item.notes?.trim() || undefined,
    };
  });
}

export function normalizeRequestProfitSplitResponsibilities(
  responsibilities: RequestProfitSplitResponsibility[]
): RequestProfitSplitResponsibility[] {
  return responsibilities.map(item => ({
    role: item.role,
    userId: item.userId.trim(),
    userName: item.userName.trim(),
    percentage: item.percentage,
    notes: item.notes?.trim() || undefined,
  }));
}

export function responsibilitiesToParticipantInput(
  responsibilities: RequestProfitSplitResponsibility[]
): Omit<ProfitSplitParticipant, 'amount'>[] {
  return responsibilities.map(item => ({
    id: `role_${item.role}`,
    userId: item.userId,
    userName: item.userName,
    role: item.role,
    percentage: item.percentage,
    notes: item.notes,
  }));
}

export function resolveProfitSplitResponsibilitiesFromContext(
  request: Pick<
    PricingRequest,
    'assignedTo' | 'assignedToName' | 'profitSplitResponsibilities'
  >,
  organization?: Pick<Organization, 'responsibleAgencyUserId'> | null,
  responsibleAgencyUserName?: string
): RequestProfitSplitResponsibility[] {
  return resolveRequestProfitSplitResponsibilities({
    responsibleAgencyUserId: organization?.responsibleAgencyUserId,
    responsibleAgencyUserName,
    assignedTo: request.assignedTo,
    assignedToName: request.assignedToName,
    storedResponsibilities: request.profitSplitResponsibilities,
  });
}

export function createParticipantId(): string {
  return generateId('participant');
}
