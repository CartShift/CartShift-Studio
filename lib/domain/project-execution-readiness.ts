type LinkedWork = {
  orgId?: string;
  projectId?: string;
  status?: string;
  isBillable?: boolean;
  requestRole?: string;
  paymentRequired?: boolean;
  amountPaid?: number;
  depositAmount?: number;
};

export function getProjectExecutionBlockers(
  projectId: string, orgId: string, linkedRequests: readonly LinkedWork[],
): string[] {
  const blockers: string[] = [];
  for (const [index, request] of linkedRequests.entries()) {
    if (request.orgId !== orgId || request.projectId !== projectId) {
      blockers.push('CROSS_ORGANIZATION_OR_STALE_REQUEST_LINK_' + index);
      continue;
    }
    if (['NEW', 'NEEDS_INFO', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW'].includes(request.status || '')) {
      blockers.push('OPEN_WORK_' + index);
    }
    const agreement = request.isBillable && request.requestRole !== 'bundle_item';
    if (agreement && request.paymentRequired && ['ACCEPTED', 'PAID'].includes(request.status || '') &&
      Number(request.amountPaid || 0) < Number(request.depositAmount || 0)) {
      blockers.push('UNPAID_DEPOSIT_' + index);
    }
  }
  return blockers;
}
