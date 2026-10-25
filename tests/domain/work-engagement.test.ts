import { describe, expect, it } from 'vitest';
import {
  countActiveProBonoProjects, normalizeWorkMode, permitsCommercialDocument,
  projectWorkMode,
} from '@/lib/domain/work-engagement';

describe('work engagement classification', () => {
  it('keeps legacy projects commercial by default without inferring payment', () => {
    expect(normalizeWorkMode(undefined)).toBe('commercial');
    expect(projectWorkMode({})).toBe('commercial');
    expect(permitsCommercialDocument(projectWorkMode({}))).toBe(true);
  });

  it('inherits the new customer default only when the project has no explicit mode', () => {
    expect(projectWorkMode({}, 'pro_bono')).toBe('pro_bono');
    expect(projectWorkMode({ workMode: 'commercial' }, 'pro_bono')).toBe('commercial');
    expect(permitsCommercialDocument('pro_bono')).toBe(false);
  });

  it('counts only open pro bono projects, not zero-value or completed commercial projects', () => {
    const projects = [
      { status: 'in_progress', workMode: 'pro_bono' as const },
      { status: 'client_review', workMode: 'pro_bono' as const },
      { status: 'completed', workMode: 'pro_bono' as const },
      { status: 'planning', workMode: 'commercial' as const },
      { status: 'blocked' },
    ];
    expect(countActiveProBonoProjects(projects)).toBe(2);
  });
});
