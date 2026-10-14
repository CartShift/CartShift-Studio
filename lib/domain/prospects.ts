import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { z } from 'zod';

const blockedNames = new Set(['localhost', 'localhost.localdomain']);
const blockedSuffixes = ['.localhost', '.local', '.internal', '.test', '.example', '.invalid'];

function publicHttpsUrl(value: string): URL {
  const url = new URL(value.trim());
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !hostname.includes('.') || isIP(hostname.replace(/^\[|\]$/g, '')) ||
      blockedNames.has(hostname) || blockedSuffixes.some(suffix => hostname.endsWith(suffix))) {
    throw new Error('A public HTTPS business URL is required');
  }
  return url;
}

export function normalizeProspectStoreUrl(value: string): { canonicalDomain: string; storeUrl: string } {
  const url = publicHttpsUrl(value.startsWith('http') ? value : `https://${value}`);
  const canonicalDomain = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  if (!canonicalDomain.includes('.') || canonicalDomain.split('.').some(p => !p)) {
    throw new Error('Invalid store domain');
  }
  return { canonicalDomain, storeUrl: `https://${canonicalDomain}` };
}

export function validateProspectSource(value: string): string {
  return publicHttpsUrl(value).toString();
}

export function verifyProspectEvidenceUrl(value: string, canonicalDomain: string): string {
  const url = publicHttpsUrl(value);
  const domain = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  if (domain !== canonicalDomain) throw new Error('Finding evidence must reference the store domain');
  return url.toString();
}

export function prospectDocumentId(domain: string): string {
  return `prospect_${createHash('sha256').update(domain).digest('hex').slice(0, 32)}`;
}

export const upsertProspectSchema = z.object({
  store_url: z.string().trim().min(4).max(512),
  brand_name: z.string().trim().min(1).max(180).optional(),
  source_url: z.string().trim().url().max(1024),
  source_type: z.enum(['manual', 'chatgpt_research', 'spreadsheet_import']).default('chatgpt_research'),
  research_note: z.string().trim().max(1000).optional(),
}).strict();

export const prospectFindingSchema = z.object({
  prospect_id: z.string().regex(/^prospect_[a-f0-9]{32}$/),
  category: z.enum(['ux', 'rtl', 'seo', 'accessibility', 'performance', 'content', 'operations', 'other']),
  title: z.string().trim().min(6).max(160),
  observed_url: z.string().trim().url().max(1024),
  evidence_excerpt: z.string().trim().min(12).max(800),
  business_relevance: z.string().trim().max(500).optional(),
}).strict();

export type UpsertProspectInput = z.infer<typeof upsertProspectSchema>;
export type ProspectFindingInput = z.infer<typeof prospectFindingSchema>;
