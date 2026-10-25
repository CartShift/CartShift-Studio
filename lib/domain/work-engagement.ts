/**
 * Engagement billing intent is distinct from customer status and actual receipts.
 * A project keeps its own work mode so the client default can change safely.
 */
export const WORK_MODES = ['commercial', 'pro_bono'] as const;
export type WorkMode = typeof WORK_MODES[number];

export function normalizeWorkMode(value: unknown): WorkMode {
  return value === 'pro_bono' ? 'pro_bono' : 'commercial';
}

export function projectWorkMode(
  project: { workMode?: WorkMode | null } | null | undefined,
  defaultMode: WorkMode = 'commercial',
): WorkMode {
  return project?.workMode ? normalizeWorkMode(project.workMode) : defaultMode;
}

export function permitsCommercialDocument(mode: WorkMode): boolean {
  return mode === 'commercial';
}

/** Never infer receipts, invoice/payment status, or work type from a zero rate. */
export function countActiveProBonoProjects<T extends { status: string; workMode?: WorkMode }>(
  projects: readonly T[],
): number {
  const open = new Set(['planning', 'in_progress', 'client_review', 'blocked', 'ready_to_launch']);
  return projects.filter(project => project.workMode === 'pro_bono' && open.has(project.status)).length;
}
