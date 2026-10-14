import sanitizeHtml from 'sanitize-html';

export type CandidateFinding = {
  category: 'seo' | 'content' | 'accessibility';
  title: string;
  observed_url: string;
  evidence_excerpt: string;
  business_relevance: string;
};

export type CandidateContact = {
  name?: string;
  role: string;
  business_email?: string;
  source_url: string;
  evidence_excerpt: string;
};

export const SCAN_USER_AGENT = 'CartShift-AuditBot';
export const MAX_SCAN_PAGES = 6;

export function publicIpv4Only(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)) return false;
  return true;
}

function attrs(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return result;
}

function linkTargets(html: string): string[] {
  return [...html.matchAll(/<a\s[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)]
    .map(match => match[1] || match[2] || match[3]);
}

function allowedPage(url: URL, hostname: string): boolean {
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const domain = hostname.toLowerCase().replace(/^www\./, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      host !== domain || url.search || url.hash) return false;
  return !/(?:^|\/)(?:cart|checkout|checkouts|account|admin|login|register|password|apps|search)(?:\/|$)/i.test(url.pathname);
}

export function buildProspectCrawlPlan(homeUrl: string, homepageHtml: string): string[] {
  const home = new URL(homeUrl);
  const pool = new Set<string>();
  for (const href of linkTargets(homepageHtml)) {
    try {
      const url = new URL(href.replace(/&amp;/g, '&'), home);
      if (!allowedPage(url, home.hostname)) continue;
      url.hash = '';
      pool.add(url.toString());
    } catch { /* Ignore malformed links */ }
  }
  const score = (item: string) => {
    const path = new URL(item).pathname;
    if (/\/pages?\/(?:about|our-story|team)/i.test(path) || /\/about/i.test(path)) return 0;
    if (/\/pages?\/(?:contact|support)/i.test(path) || /\/contact/i.test(path)) return 1;
    if (/\/policies\/(?:shipping|refund)/i.test(path) || /\/shipping/i.test(path)) return 2;
    if (/\/products?\//i.test(path)) return 3;
    if (/\/collections?\//i.test(path)) return 4;
    return 9;
  };
  return [...pool].filter(item => item !== home.toString())
    .sort((a, b) => score(a) - score(b) || a.localeCompare(b))
    .slice(0, MAX_SCAN_PAGES - 1);
}

type Rule = { pattern: string; allowed: boolean; agent: string };

export function robotsAllowsPath(robots: string, path: string): boolean {
  if (robots.length > 512_000) return false;
  const rules: Rule[] = [];
  let agents: string[] = [];
  let hasDirective = false;
  let sawRules = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.split('#')[0].trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const type = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (type === 'user-agent') {
      if (sawRules) { agents = []; sawRules = false; }
      agents.push(value.toLowerCase());
    } else if ((type === 'allow' || type === 'disallow') && agents.length) {
      sawRules = true;
      hasDirective = true;
      for (const agent of agents) {
        if (value) rules.push({ agent, pattern: value.split('*')[0], allowed: type === 'allow' });
      }
    }
  }
  if (!hasDirective) return true;
  const own = rules.filter(r => r.agent === SCAN_USER_AGENT.toLowerCase());
  const matching = (own.length ? own : rules.filter(r => r.agent === '*'))
    .filter(r => path.startsWith(r.pattern))
    .sort((a, b) => b.pattern.length - a.pattern.length || Number(b.allowed) - Number(a.allowed));
  return matching[0]?.allowed ?? true;
}

export type ShippingThresholdEvidence = {
  sourceUrl: string; amount: number; excerpt: string;
};

export function extractFreeShippingThresholds(url: string, html: string): ShippingThresholdEvidence[] {
  const plain = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\\s+/g, ' ').trim().slice(0, 80_000);
  const found = new Map<number, ShippingThresholdEvidence>();
  const regex = /(?:משלוח\\s+חינם|free\\s+shipping)[^₪$\\d]{0,55}[₪$]?\\s*(\\d{2,5})/gi;
  for (const match of plain.matchAll(regex)) {
    const amount = Number(match[1]);
    if (Number.isFinite(amount) && amount >= 30 && amount <= 10000 && !found.has(amount)) {
      found.set(amount, { sourceUrl: url, amount, excerpt: match[0].slice(0, 160) });
    }
  }
  return [...found.values()].slice(0, 3);
}

function decisionMakerCandidates(url: string, html: string): CandidateContact[] {
  const results: CandidateContact[] = [];
  const scripts = [...html.matchAll(/<script\\b[^>]*type\\s*=\\s*["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)].slice(0, 15);
  const walk = (node: unknown, depth = 0): void => {
    if (depth > 6 || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.slice(0, 30).forEach(x => walk(x, depth + 1)); return; }
    const data = node as Record<string, unknown>;
    const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const role = typeof data.jobTitle === 'string' ? data.jobTitle.trim() : '';
    if (types.some(t => typeof t === 'string' && /(?:^|\\/)Person$/i.test(t)) &&
        name.length >= 3 && name.length <= 120 && role.length >= 3 && role.length <= 120 &&
        /founder|owner|chief executive|ceo|e.?commerce|head of digital|head of marketing|מייסד|מנכ|בעלים|מנהלת?\\s*(?:שיווק|דיגיטל)/i.test(role) &&
        data.worksFor) {
      results.push({ name, role, source_url: url,
        evidence_excerpt: `Official store structured data lists ${name} as ${role}.`.slice(0, 390) });
    }
    for (const key of ['@graph', 'employee', 'founder']) {
      if (data[key]) walk(data[key], depth + 1);
    }
  };
  for (const script of scripts) {
    try { walk(JSON.parse(script[1])); } catch { /* Bad JSON-LD is not a finding. */ }
  }
  return results.slice(0, 3);
}

export function extractProspectPageEvidence(url: string, html: string, isHomepage: boolean): {
  findings: CandidateFinding[]; contacts: CandidateContact[];
} {
  const findings: CandidateFinding[] = [];
  const contacts: CandidateContact[] = [];
  if (isHomepage) {
    const descriptions = [...html.matchAll(/<meta\b[^>]*>/gi)]
      .map(x => attrs(x[0]))
      .filter(a => a.name?.toLowerCase() === 'description' && a.content?.trim());
    if (!descriptions.length) findings.push({
      category: 'seo', title: 'Missing homepage meta description',
      observed_url: url,
      evidence_excerpt: 'No non-empty <meta name="description"> tag was present in the returned homepage HTML.',
      business_relevance: 'Potential opportunity to improve search-result descriptions; confirm rendered SEO output first.',
    });
  }
  // Only generic, publicly published business mailboxes; named personal accounts
  // require a separate human privacy review and are not saved automatically.
  for (const href of linkTargets(html)) {
    if (!href.toLowerCase().startsWith('mailto:')) continue;
    const email = href.slice(7).split('?')[0].trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) continue;
    if (!/^(?:info|hello|contact|office|team|sales|support|service|customerservice)@/.test(email)) continue;
    if (contacts.some(contact => contact.business_email === email)) continue;
    contacts.push({
      role: 'Business contact', business_email: email, source_url: url,
      evidence_excerpt: `Public company page links to a generic business email address: ${email}`,
    });
  }
  for (const candidate of decisionMakerCandidates(url, html)) {
    if (!contacts.some(c => c.name === candidate.name && c.role === candidate.role)) {
      contacts.push(candidate);
    }
  }
  // Extracted source HTML alone cannot prove visible layout, checkout performance,
  // broken UX interactions, or a specific change in conversion.
  return { findings, contacts: contacts.slice(0, 6) };
}
