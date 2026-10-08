import { describe, expect, it } from 'vitest';
import {
  buildProjectTemplate, getProjectHealth, loggedHours, projectBudget,
} from '@/lib/utils/project-workflow';
import type { ClientProject, ProjectReview } from '@/lib/types/project';

const project = (): ClientProject => ({
  id: 'proj-1',
  orgId: 'org-1',
  title: 'New catalog',
  summary: '',
  nextStep: '',
  status: 'in_progress',
  template: 'catalog_launch',
  ...buildProjectTemplate('catalog_launch'),
  blockers: [],
  deliverables: [{ id: 'home', title: 'Homepage', revision: 1 }],
  workLogs: [],
  changes: [],
  updates: [],
  scope: { minHours: 12, maxHours: 16, rateCents: 25000, currency: 'ILS' },
  createdBy: 'agency',
  createdAt: {} as ClientProject['createdAt'],
  updatedAt: {} as ClientProject['updatedAt'],
});
const review = (revision = 1, decision: ProjectReview['decision'] = 'approved'): ProjectReview => ({
  id: 'home_reviewer',
  projectId: 'proj-1',
  orgId: 'org-1',
  deliverableId: 'home',
  reviewerId: 'reviewer',
  revision,
  decision,
  comment: '',
  updatedAt: {} as ProjectReview['updatedAt'],
});

describe('project workflows', () => {
  it('creates useful, initially incomplete milestones, materials, and QA checks', () => {
    const input = buildProjectTemplate('catalog_launch');
    expect(input.stages.length).toBeGreaterThan(2);
    expect(input.stages.every(s => s.status === 'pending')).toBe(true);
    expect(input.launchChecks.every(s => !s.done && s.required)).toBe(true);
    expect(input.inputs.length).toBeGreaterThan(0);
    expect(buildProjectTemplate('catalog_launch', 'he').stages[0].title).toContain('קטלוג');
  });
  it('blocks release until blockers, inputs, checks and current reviews are clear', () => {
    const p = project();
    expect(getProjectHealth(p, []).readyForLaunch).toBe(false);
    p.launchChecks.forEach(x => x.done = true);
    p.inputs.forEach(x => x.done = true);
    expect(getProjectHealth(p, [review()]).readyForLaunch).toBe(true);
    p.blockers.push({id:'provider',title:'Fulfillment',nextAction:'Follow up',owner:'vendor',resolved:false});
    expect(getProjectHealth(p, [review()]).readyForLaunch).toBe(false);
    p.blockers[0].resolved = true;
    p.deliverables[0].revision = 2;
    expect(getProjectHealth(p, [review()]).pendingReviews).toBe(1);
    expect(getProjectHealth(p, [review(2, 'changes_requested')]).readyForLaunch).toBe(false);
    expect(getProjectHealth(p, [review(2)]).readyForLaunch).toBe(true);
  });
  it('calculates hours and monetary values without double counting', () => {
    const p = project();
    p.workLogs = [
      {id:'a',note:'Build',hours:2.5,createdAt:1},
      {id:'b',note:'QA',hours:1.25,createdAt:2},
    ];
    expect(loggedHours(p)).toBe(3.75);
    expect(projectBudget(p)).toEqual({minCents:300000,maxCents:400000});
  });
});
