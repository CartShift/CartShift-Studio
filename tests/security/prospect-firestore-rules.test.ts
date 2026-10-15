import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rules = readFileSync('firestore.rules', 'utf8');

describe('candidate research data is server-only in Firestore', () => {
  it('explicitly denies direct client SDK access to leads, evidence and contacts', () => {
    expect(rules).toMatch(/match \/agency_prospects\/\{prospectId\}\s*\{\s*allow read, write: if false;/);
    expect(rules).toMatch(/match \/findings\/\{findingId\}\s*\{\s*allow read, write: if false;/);
    expect(rules).toMatch(/match \/contacts\/\{contactId\}\s*\{\s*allow read, write: if false;/);
    expect(rules).toMatch(/match \/activities\/\{activityId\}\s*\{\s*allow read, write: if false;/);
  });

  it('explicitly denies quota and audit collection reads and writes', () => {
    expect(rules).toMatch(/match \/agency_prospect_scan_quotas\/\{quotaId\}\s*\{\s*allow read, write: if false;/);
    expect(rules).toMatch(/match \/agency_prospect_audit\/\{eventId\}\s*\{\s*allow read, write: if false;/);
  });
});
