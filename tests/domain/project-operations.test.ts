import { describe, expect, it } from 'vitest';
import {
  initialProjectRecordStatus, projectCommercialSummary, validateProjectPrivateRecord,
  validProjectRecordTransition,
} from '@/lib/domain/project-operations';

describe('private project operations', () => {
  it('requires meaningful evidence and rejects dangerous URL protocols', () => {
    expect(validateProjectPrivateRecord({ kind: 'decision', title: 'Client confirmed 10 units', details: '' })).toBeNull();
    expect(validateProjectPrivateRecord({ kind: 'qa', title: 'QA', details: '', sourceUrl: 'javascript:alert(1)' })).toMatch(/HTTP/);
    expect(validateProjectPrivateRecord({ kind: 'dependency', title: '', details: '' })).toMatch(/Title/);
    expect(validateProjectPrivateRecord({ kind: 'time', title: 'QA work', details: '', hours: 2.25 })).toBeNull();
    expect(validateProjectPrivateRecord({ kind: 'time', title: 'QA work', details: '', hours: 0 })).toMatch(/Time/);
    expect(validateProjectPrivateRecord({ kind: 'decision', title: 'Ok', details: '', hours: 2 })).toMatch(/Only time/);
  });
  it('keeps QA failures distinct from completion and time logs immutable', () => {
    expect(initialProjectRecordStatus('qa')).toBe('open');
    expect(initialProjectRecordStatus('time')).toBe('done');
    expect(validProjectRecordTransition('qa', 'failed')).toBe(true);
    expect(validProjectRecordTransition('qa', 'done')).toBe(false);
    expect(validProjectRecordTransition('decision', 'confirmed')).toBe(true);
    expect(validProjectRecordTransition('decision', 'passed')).toBe(false);
  });
  it('does not treat reported deposits as paid and excludes child requests', () => {
    const a = projectCommercialSummary([
      { projectId: 'a', isBillable: true, requestRole: 'bundle', totalAmount: 400000,
        amountPaid: 0, reportedDepositMinor: 200000 },
      { projectId: 'a', isBillable: true, requestRole: 'bundle_item', totalAmount: 100000 },
      { projectId: 'b', isBillable: true, totalAmount: 500000 },
    ], 'a');
    expect(a).toEqual({
      estimatedCapMinor: 400000, recordedPaidMinor: 0,
      reportedUnverifiedMinor: 200000, estimatedBalanceMinor: 400000, proposalCount: 1,
    });
  });
  it('never shows a negative remaining balance after payment totals', () => {
    expect(projectCommercialSummary([
      { projectId: 'p', isBillable: true, totalAmount: 10000, amountPaid: 15000 },
    ], 'p').estimatedBalanceMinor).toBe(0);
  });
});
