import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rules = readFileSync('firestore.rules', 'utf8');

describe('business development database isolation', () => {
  it('does not treat BD as a general agency user for client and commercial rules', () => {
    const start = rules.indexOf('function isAgencyUser()');
    const end = rules.indexOf('function isBusinessDevelopmentUser()', start);
    const agency = rules.slice(start, end);
    expect(agency).toContain("agencyRole', '') != 'business_development'");
    expect(rules).toMatch(/function isSalesLeadReader\(\)/);
    expect(rules).toMatch(/match \/marketing_leads\/\{leadId\} \{\s*allow read: if isAuthenticated\(\) && isSalesLeadReader\(\)/);
    expect(rules).toMatch(/match \/portal_requests\/\{requestId\}/);
    expect(rules).toContain('!isBusinessDevelopmentUser()');
  });

  it('limits agency team discovery to agency staff and keeps marketing consent immutable', () => {
    expect(rules).toContain("(isBusinessDevelopmentUser() && resource.data.get('accountType', '') == 'AGENCY')");
    expect(rules).toContain("'contactStatus', 'lastContactedAt', 'updatedAt'");
    const leads = rules.slice(rules.indexOf('match /marketing_leads/{leadId}'),
      rules.indexOf('match /marketing_email_jobs/{jobId}'));
    expect(leads).not.toContain('marketingConsent');
  });
});

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
