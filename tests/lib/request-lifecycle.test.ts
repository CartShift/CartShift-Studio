import { describe, expect, it } from 'vitest';
import { REQUEST_STATUS } from '@/lib/types/portal';
import {
  REQUEST_ALLOWED_TRANSITIONS, WORKBOARD_STATUS_GROUPS,
  canTransitionRequest, getRequestWorkboardGroup,
} from '@/lib/utils/request-lifecycle';

describe('request lifecycle', () => {
  it('maps each request status to exactly one workboard column', () => {
    const statuses = Object.values(REQUEST_STATUS);
    const grouped = Object.values(WORKBOARD_STATUS_GROUPS).flat();
    expect(grouped).toHaveLength(statuses.length);
    expect([...grouped].sort()).toEqual([...statuses].sort());
    expect(new Set(grouped).size).toBe(statuses.length);
    expect(getRequestWorkboardGroup('CANCELED')).toBe('archived');
    expect(getRequestWorkboardGroup('QUOTED')).toBe('backlog');
  });
  it('prevents skipping quote acceptance and reopening terminal states', () => {
    expect(canTransitionRequest('QUOTED', 'IN_PROGRESS')).toBe(false);
    expect(canTransitionRequest('QUOTED', 'ACCEPTED')).toBe(true);
    expect(canTransitionRequest('ACCEPTED', 'IN_PROGRESS')).toBe(true);
    expect(canTransitionRequest('CANCELED', 'IN_PROGRESS')).toBe(false);
    expect(canTransitionRequest('IN_REVIEW', 'IN_PROGRESS')).toBe(true);
  });
  it('contains one transition list per supported status', () => {
    expect(Object.keys(REQUEST_ALLOWED_TRANSITIONS).sort())
      .toEqual(Object.values(REQUEST_STATUS).sort());
  });
});
