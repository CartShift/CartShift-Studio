import type { Timestamp } from 'firebase/firestore';

export type ProjectStatus =
  | 'planning'
  | 'in_progress'
  | 'client_review'
  | 'blocked'
  | 'ready_to_launch'
  | 'completed'
  | 'archived';
export type ProjectTemplate = 'shopify_theme' | 'catalog_launch' | 'seo' | 'custom';
export type ProjectStageStatus = 'pending' | 'in_progress' | 'completed';
export type ProjectReviewDecision = 'approved' | 'changes_requested';

export interface ProjectStage {
  id: string;
  title: string;
  status: ProjectStageStatus;
}
export interface ProjectBlocker {
  id: string;
  title: string;
  owner: 'agency' | 'client' | 'vendor';
  nextAction: string;
  resolved: boolean;
}
export interface ProjectDeliverable {
  id: string;
  title: string;
  previewUrl?: string;
  revision: number;
}
export interface ProjectChecklistItem {
  id: string;
  title: string;
  done: boolean;
  required: boolean;
}
export interface ProjectWorkLog {
  id: string;
  note: string;
  hours: number;
  createdAt: number;
}
export interface ProjectUpdate {
  id: string;
  text: string;
  createdAt: number;
  author: string;
}
export interface ProjectChangeRequest {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  status: 'proposed' | 'approved' | 'declined';
}
export interface ProjectScope {
  minHours: number;
  maxHours: number;
  rateCents: number;
  currency: 'ILS' | 'USD' | 'EUR';
}
export interface ClientProject {
  id: string;
  orgId: string;
  title: string;
  summary: string;
  nextStep: string;
  status: ProjectStatus;
  template: ProjectTemplate;
  stages: ProjectStage[];
  blockers: ProjectBlocker[];
  deliverables: ProjectDeliverable[];
  launchChecks: ProjectChecklistItem[];
  inputs: ProjectChecklistItem[];
  workLogs: ProjectWorkLog[];
  updates: ProjectUpdate[];
  changes: ProjectChangeRequest[];
  reviewRevisions: Record<string, number>;
  scope: ProjectScope;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectReview {
  id: string;
  projectId: string;
  orgId: string;
  deliverableId: string;
  reviewerId: string;
  revision: number;
  decision: ProjectReviewDecision;
  comment: string;
  updatedAt: Timestamp;
}

export type ProjectCollectionField =
  | 'stages'
  | 'blockers'
  | 'deliverables'
  | 'launchChecks'
  | 'inputs'
  | 'workLogs'
  | 'updates'
  | 'changes';

export type ProjectCollectionItem = {
  stages: ProjectStage;
  blockers: ProjectBlocker;
  deliverables: ProjectDeliverable;
  launchChecks: ProjectChecklistItem;
  inputs: ProjectChecklistItem;
  workLogs: ProjectWorkLog;
  updates: ProjectUpdate;
  changes: ProjectChangeRequest;
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, { en: string; he: string }> = {
  planning: { en: 'Planning', he: 'בתכנון' },
  in_progress: { en: 'In progress', he: 'בעבודה' },
  client_review: { en: 'Client review', he: 'לבדיקת הלקוח' },
  blocked: { en: 'Blocked', he: 'ממתין לגורם חיצוני' },
  ready_to_launch: { en: 'Ready for launch', he: 'מוכן להשקה' },
  completed: { en: 'Completed', he: 'הושלם' },
  archived: { en: 'Archived', he: 'בארכיון' },
};
