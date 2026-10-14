/** Client reads are served by a whitelist. Firestore SDK never exposes draft/agency fields. */
const SAFE_FIELDS = [
  'orgId', 'projectId', 'title', 'description', 'type', 'status', 'priority',
  'createdBy', 'createdByName', 'assignedTo', 'assignedToName', 'tags', 'attachmentIds',
  'commentCount', 'createdAt', 'updatedAt', 'closedAt', 'deliveredAt',
  'requestRole', 'parentRequestId', 'childRequestIds', 'lastComment',
  'milestones', 'currentMilestoneId', 'estimatedHours', 'isBillable',
  'lineItems', 'totalAmount', 'subtotal', 'taxAmount', 'taxRate', 'currency',
  'validUntil', 'quotedAt', 'paymentDueAt', 'paymentStatus', 'amountPaid',
  'balanceDue', 'clientNotes', 'acceptedAt', 'declinedAt', 'paidAt',
  'timeframe', 'workDeadline', 'proposalContent', 'terms', 'clientName',
  'paymentRequired', 'depositAmount', 'proposalVersion', 'relatedRequestId',
] as const;

export type StoredRequest = Record<string, unknown>;
export function isCommercialRequestRecord(row: StoredRequest): boolean {
  return row.isBillable === true || Boolean(row.publicToken) ||
    row.requestRole === 'bundle' || row.requestRole === 'bundle_item';
}

export function sanitizeClientRequest(id: string, row: StoredRequest): StoredRequest | null {
  const commercial = isCommercialRequestRecord(row);
  if (commercial) {
    const stage = String(row.status || '');
    const shared = stage !== 'DRAFT' && (
      row.requestRole === 'bundle_item' ||
      row.publicAccessEnabled === true ||
      ['ACCEPTED', 'PAID', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED', 'CLOSED'].includes(stage)
    );
    if (!shared) return null;
  }
  // Published signed terms override any unpublished working-draft edits.
  const published = commercial && row.publishedProposal &&
    typeof row.publishedProposal === 'object' && !Array.isArray(row.publishedProposal)
    ? row.publishedProposal as StoredRequest : {};
  const merged = { ...row, ...published };
  const result: StoredRequest = { id };
  for (const field of SAFE_FIELDS) {
    if (merged[field] !== undefined) result[field] = merged[field];
  }
  // Work execution/payment status is operational and must not be rolled back
  // to a historic published commercial snapshot.
  result.status = row.status;
  result.projectId = row.projectId ?? null;
  return result;
}

