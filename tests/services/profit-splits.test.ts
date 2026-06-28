import { describe, expect, it } from 'vitest';
import {
  calculateProfitSplit,
  createDefaultProfitSplitParticipants,
} from '@/lib/services/profit-splits';
import { PROFIT_SPLIT_ROLE } from '@/lib/types/profit-split';
import {
  extractStoredProfitSplitResponsibilities,
  resolveRequestProfitSplitResponsibilities,
} from '@/lib/utils/profit-split-responsibilities';

describe('profit split responsibilities', () => {
  it('derives lead from client responsible agent and delivery from assigned specialist', () => {
    const resolved = resolveRequestProfitSplitResponsibilities({
      responsibleAgencyUserId: 'agent-1',
      responsibleAgencyUserName: 'Ada',
      assignedTo: 'dev-1',
      assignedToName: 'Grace',
      storedResponsibilities: [
        {
          role: PROFIT_SPLIT_ROLE.SALES,
          userId: 'sales-1',
          userName: 'Bob',
          percentage: 10,
        },
      ],
    });

    expect(resolved.find(item => item.role === PROFIT_SPLIT_ROLE.LEAD)).toEqual({
      role: PROFIT_SPLIT_ROLE.LEAD,
      userId: 'agent-1',
      userName: 'Ada',
      percentage: 15,
    });
    expect(resolved.find(item => item.role === PROFIT_SPLIT_ROLE.DELIVERY)).toEqual({
      role: PROFIT_SPLIT_ROLE.DELIVERY,
      userId: 'dev-1',
      userName: 'Grace',
      percentage: 50,
    });
    expect(resolved.find(item => item.role === PROFIT_SPLIT_ROLE.SALES)).toEqual({
      role: PROFIT_SPLIT_ROLE.SALES,
      userId: 'sales-1',
      userName: 'Bob',
      percentage: 10,
    });
  });

  it('stores only request-level overrides without lead/delivery user ids', () => {
    const resolved = resolveRequestProfitSplitResponsibilities({
      responsibleAgencyUserId: 'agent-1',
      responsibleAgencyUserName: 'Ada',
      assignedTo: 'dev-1',
      assignedToName: 'Grace',
    });
    const stored = extractStoredProfitSplitResponsibilities(resolved);

    expect(stored.find(item => item.role === PROFIT_SPLIT_ROLE.LEAD)).toEqual({
      role: PROFIT_SPLIT_ROLE.LEAD,
      userId: '',
      userName: '',
      percentage: 15,
    });
    expect(stored.find(item => item.role === PROFIT_SPLIT_ROLE.DELIVERY)).toEqual({
      role: PROFIT_SPLIT_ROLE.DELIVERY,
      userId: '',
      userName: '',
      percentage: 50,
    });
  });
});

describe('profit split calculations', () => {
  it('creates the default 15/10/25/50 role allocation', () => {
    const participants = createDefaultProfitSplitParticipants();

    expect(participants).toEqual([
      expect.objectContaining({ role: PROFIT_SPLIT_ROLE.LEAD, percentage: 15, userId: '' }),
      expect.objectContaining({ role: PROFIT_SPLIT_ROLE.SALES, percentage: 10, userId: '' }),
      expect.objectContaining({ role: PROFIT_SPLIT_ROLE.MANAGEMENT, percentage: 25, userId: '' }),
      expect.objectContaining({ role: PROFIT_SPLIT_ROLE.DELIVERY, percentage: 50, userId: '' }),
    ]);
  });

  it('subtracts direct expenses before calculating participant payouts', () => {
    const result = calculateProfitSplit({
      grossRevenue: 100_000,
      directExpenses: [{ id: 'expense-1', description: 'Contractor', amount: 10_000 }],
      participants: createDefaultProfitSplitParticipants(),
    });

    expect(result.totalExpenses).toBe(10_000);
    expect(result.netProfit).toBe(90_000);
    expect(result.participants.map(participant => participant.amount)).toEqual([
      13_500, 9_000, 22_500, 45_000,
    ]);
    expect(result.totalAllocatedAmount).toBe(90_000);
    expect(result.unallocatedAmount).toBe(0);
  });

  it('allocates every cent deterministically when percentages total 100%', () => {
    const result = calculateProfitSplit({
      grossRevenue: 1,
      directExpenses: [],
      participants: [
        {
          id: 'participant-1',
          userId: 'user-1',
          userName: 'Ada',
          role: PROFIT_SPLIT_ROLE.DELIVERY,
          percentage: 50,
        },
        {
          id: 'participant-2',
          userId: 'user-2',
          userName: 'Grace',
          role: PROFIT_SPLIT_ROLE.DELIVERY,
          percentage: 50,
        },
      ],
    });

    expect(result.participants.map(participant => participant.amount)).toEqual([1, 0]);
    expect(result.totalAllocatedAmount).toBe(1);
    expect(result.unallocatedAmount).toBe(0);
  });

  it('allows negative profit calculations for draft warnings', () => {
    const result = calculateProfitSplit({
      grossRevenue: 1_000,
      directExpenses: [{ id: 'expense-1', description: 'Contractor', amount: 1_500 }],
      participants: createDefaultProfitSplitParticipants(),
    });

    expect(result.netProfit).toBe(-500);
  });

  it('rejects invalid expense amounts and participant percentages', () => {
    expect(() =>
      calculateProfitSplit({
        grossRevenue: 1_000,
        directExpenses: [{ id: 'expense-1', description: 'Contractor', amount: -1 }],
        participants: createDefaultProfitSplitParticipants(),
      })
    ).toThrow();

    expect(() =>
      calculateProfitSplit({
        grossRevenue: 1_000,
        directExpenses: [],
        participants: [
          {
            id: 'participant-1',
            userId: 'user-1',
            userName: 'Ada',
            role: PROFIT_SPLIT_ROLE.DELIVERY,
            percentage: 101,
          },
        ],
      })
    ).toThrow();
  });
});
