/** Agency-only operational evidence, separate from client-visible portal_projects. */
export const PROJECT_RECORD_KINDS = ['decision', 'qa', 'dependency', 'follow_up', 'time'] as const;
export type ProjectRecordKind = typeof PROJECT_RECORD_KINDS[number];
export type ProjectRecordStatus = 'open' | 'confirmed' | 'passed' | 'failed' | 'done';

export interface ProjectPrivateRecord {
  id: string;
  kind: ProjectRecordKind;
  title: string;
  details: string;
  status: ProjectRecordStatus;
  sourceUrl?: string;
  owner?: string;
  dueDate?: string;
  hours?: number;
  createdBy: string;
  createdAtMs: number;
}

export type NewProjectPrivateRecord = Pick<ProjectPrivateRecord, 'kind' | 'title' | 'details'> &
  Partial<Pick<ProjectPrivateRecord, 'sourceUrl' | 'owner' | 'dueDate' | 'hours'>>;

const allowedStatuses: Record<ProjectRecordKind, ProjectRecordStatus[]> = {
  decision: ['open', 'confirmed'],
  qa: ['open', 'passed', 'failed'],
  dependency: ['open', 'done'],
  follow_up: ['open', 'done'],
  time: ['done'],
};

export function initialProjectRecordStatus(kind: ProjectRecordKind): ProjectRecordStatus {
  return kind === 'time' ? 'done' : 'open';
}

export function validProjectRecordTransition(
  kind: ProjectRecordKind, status: ProjectRecordStatus
): boolean {
  return allowedStatuses[kind]?.includes(status) ?? false;
}

export function validateProjectPrivateRecord(value: NewProjectPrivateRecord): string | null {
  if (!PROJECT_RECORD_KINDS.includes(value.kind)) return 'Invalid record type';
  if (!value.title.trim() || value.title.length > 160) return 'Title must be 1–160 characters';
  if (value.details.length > 3000) return 'Details must be under 3000 characters';
  if (value.owner && value.owner.length > 100) return 'Owner must be under 100 characters';
  if (value.sourceUrl) {
    if (value.sourceUrl.length > 1024) return 'Source URL is too long';
    try {
      const url = new URL(value.sourceUrl);
      if (!['https:', 'http:'].includes(url.protocol)) return 'Source must be an HTTP(S) URL';
    } catch { return 'Source must be an HTTP(S) URL'; }
  }
  if (value.dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(value.dueDate) ||
    Number.isNaN(Date.parse(value.dueDate + 'T00:00:00Z')))) return 'Invalid due date';
  if (value.kind === 'time') {
    if (!Number.isFinite(value.hours) || value.hours! <= 0 ||
      value.hours! > 24 || !Number.isInteger(value.hours! * 4)) return 'Time must be 0.25–24 hours in quarter hours';
  } else if (value.hours !== undefined) return 'Only time records may contain hours';
  return null;
}

/** Reported funds are never counted as verified application payments. */
export function projectCommercialSummary(
  requests: Array<{
    projectId?: string; isBillable?: boolean; requestRole?: string; totalAmount?: number;
    amountPaid?: number; reportedDepositMinor?: number; depositAmount?: number;
    status?: string; currency?: string;
  }>,
  projectId: string
) {
  const proposals = requests.filter(r => r.projectId === projectId && r.isBillable &&
    r.requestRole !== 'bundle_item');
  // Never add minor amounts from two currencies (or an unknown legacy
  // currency): the resulting balance would be financially meaningless.
  const currencies = new Set(proposals.map(proposal => proposal.currency || 'unknown'));
  const currency = currencies.size === 1 && !currencies.has('unknown')
    ? [...currencies][0] : null;
  const mixedCurrencies = proposals.length > 0 && currency === null;
  if (mixedCurrencies) {
    return { estimatedCapMinor: 0, recordedPaidMinor: 0,
      reportedUnverifiedMinor: 0, estimatedBalanceMinor: 0,
      proposalCount: proposals.length, currency: null, mixedCurrencies: true };
  }
  const totals = proposals.reduce((acc, proposal) => {
    const cap = Math.max(0, Number(proposal.totalAmount) || 0);
    const paid = Math.min(cap, Math.max(0, Number(proposal.amountPaid) || 0));
    return {
      estimatedCapMinor: acc.estimatedCapMinor + cap,
      recordedPaidMinor: acc.recordedPaidMinor + paid,
      reportedUnverifiedMinor: acc.reportedUnverifiedMinor +
        Math.max(0, Number(proposal.reportedDepositMinor) || 0),
      estimatedBalanceMinor: acc.estimatedBalanceMinor + cap - paid,
    };
  }, { estimatedCapMinor: 0, recordedPaidMinor: 0,
    reportedUnverifiedMinor: 0, estimatedBalanceMinor: 0 });
  return { ...totals, proposalCount: proposals.length, currency, mixedCurrencies: false };
}
