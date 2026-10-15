import { describe, expect, it } from 'vitest';
import { getProjectExecutionBlockers } from '@/lib/domain/project-execution-readiness';

describe('project execution launch gates', () => {
  it('blocks outstanding work from being declared ready', () => {
    expect(getProjectExecutionBlockers('prjA', 'orgA', [
      { projectId: 'prjA', orgId: 'orgA', status: 'IN_PROGRESS' },
    ])).toEqual(['OPEN_WORK_0']);
  });
  it('requires an accepted commercial deposit when requested', () => {
    expect(getProjectExecutionBlockers('prjA', 'orgA', [
      { projectId: 'prjA', orgId: 'orgA', status: 'ACCEPTED',
        isBillable: true, paymentRequired: true, amountPaid: 5000, depositAmount: 10000 },
    ])).toEqual(['UNPAID_DEPOSIT_0']);
  });
  it('does not block approved and fully funded closed work', () => {
    expect(getProjectExecutionBlockers('prjA', 'orgA', [
      { projectId: 'prjA', orgId: 'orgA', status: 'DELIVERED' },
      { projectId: 'prjA', orgId: 'orgA', status: 'ACCEPTED',
        isBillable: true, paymentRequired: true, amountPaid: 10000, depositAmount: 10000 },
    ])).toEqual([]);
  });
  it('never considers a cross-client link safe', () => {
    expect(getProjectExecutionBlockers('prjA', 'orgA', [
      { projectId: 'prjA', orgId: 'orgB', status: 'DELIVERED' },
    ])).toEqual(['CROSS_ORGANIZATION_OR_STALE_REQUEST_LINK_0']);
  });
});
