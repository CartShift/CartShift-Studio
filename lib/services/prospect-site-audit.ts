import 'server-only';
import { normalizeProspectStoreUrl } from '@/lib/domain/prospects';
import { detectPlatform } from '@/lib/services/analyzer-platform';
import {
  buildProspectCrawlPlan, extractProspectPageEvidence, extractFreeShippingThresholds,
  MAX_SCAN_PAGES, robotsAllowsPath,
  type CandidateContact, type CandidateFinding,
} from '@/lib/services/prospect-scan-engine';
import { fetchPublicProspectPage, type ProspectFetchResponse } from '@/lib/services/prospect-safe-http';

type AuditDeps = {
  fetch?: (url: string, originalHost?: string) => Promise<ProspectFetchResponse>;
  pause?: (milliseconds: number) => Promise<void>;
};
export type ProspectAuditResult = {
  platform: 'shopify' | 'other' | 'unknown';
  scannedUrls: string[];
  skippedUrls: string[];
  findings: CandidateFinding[];
  contacts: CandidateContact[];
};

const sleep = (milliseconds: number) => new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export async function runProspectSiteAudit(rawStoreUrl: string, deps: AuditDeps = {}): Promise<ProspectAuditResult> {
  const { storeUrl } = normalizeProspectStoreUrl(rawStoreUrl);
  const root = new URL(storeUrl);
  const fetch = deps.fetch || fetchPublicProspectPage;
  const pause = deps.pause || sleep;
  const homeUrl = root.toString().endsWith('/') ? root.toString() : root.toString() + '/';
  const robotsUrl = new URL('/robots.txt', root).toString();
  const robots = await fetch(robotsUrl, root.hostname);
  // Fail closed on blocked/unknown robots; 404 is the standard "no robots rules" case.
  if (robots.status !== 200 && robots.status !== 404) throw new Error('SCAN_ROBOTS_UNAVAILABLE');
  const rules = robots.status === 404 ? '' : robots.body;
  if (!robotsAllowsPath(rules, '/')) throw new Error('SCAN_ROBOTS_BLOCKED');

  await pause(2000);
  const home = await fetch(homeUrl, root.hostname);
  if (home.status !== 200) throw new Error('SCAN_HOMEPAGE_UNAVAILABLE');
  const platform = detectPlatform(home.body, homeUrl) === 'Shopify' ? 'shopify' :
    detectPlatform(home.body, homeUrl) ? 'other' : 'unknown';
  const scannedUrls = [home.finalUrl];
  const skippedUrls: string[] = [];
  const all = extractProspectPageEvidence(home.finalUrl, home.body, true);
  const findings = [...all.findings];
  const contacts = [...all.contacts];
  const shipping = extractFreeShippingThresholds(home.finalUrl, home.body);

  for (const url of buildProspectCrawlPlan(home.finalUrl, home.body).slice(0, MAX_SCAN_PAGES - 1)) {
    const path = new URL(url).pathname;
    if (!robotsAllowsPath(rules, path)) {
      skippedUrls.push(url);
      continue;
    }
    await pause(2000);
    try {
      const page = await fetch(url, root.hostname);
      if (page.status !== 200) {
        skippedUrls.push(url);
        if (page.status === 404 || page.status === 410) {
          findings.push({
            category: 'content', title: 'Broken internal storefront link',
            observed_url: home.finalUrl,
            evidence_excerpt: `Public homepage link ${url} returned HTTP ${page.status} during the audit.`.slice(0, 750),
            business_relevance: 'A linked destination may be unavailable to shoppers; verify manually before outreach.',
          });
        }
        continue;
      }
      scannedUrls.push(page.finalUrl);
      shipping.push(...extractFreeShippingThresholds(page.finalUrl, page.body));
      const evidence = extractProspectPageEvidence(page.finalUrl, page.body, false);
      findings.push(...evidence.findings);
      for (const contact of evidence.contacts) {
        if (!contacts.some(previous =>
          contact.business_email
            ? previous.business_email === contact.business_email
            : previous.name === contact.name && previous.role === contact.role)) {
          contacts.push(contact);
        }
      }
    } catch {
      // Individual page failure may be permission/network/timeout. Never infer a bug in the store.
      skippedUrls.push(url);
    }
  }
  const distinctThresholds = [...new Map(shipping.map(item => [item.amount, item])).values()];
  if (distinctThresholds.length >= 2) {
    const [first, second] = distinctThresholds;
    findings.push({
      category: 'content', title: 'Conflicting published free-shipping thresholds',
      observed_url: first.sourceUrl,
      evidence_excerpt: `Published threshold ${first.amount} at ${first.sourceUrl}; ${second.amount} at ${second.sourceUrl}. Verify applicable markets and conditions.`.slice(0, 750),
      business_relevance: 'Contradictory published delivery terms can confuse buyers; manual confirmation required.',
    });
  }
  return { platform, scannedUrls, skippedUrls,
    findings: findings.slice(0, 10), contacts: contacts.slice(0, 10) };
}
