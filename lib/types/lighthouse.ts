export interface LighthouseNode {
  snippet?: string;
  selector?: string;
  nodeLabel?: string;
  path?: string;
}

export interface LighthouseAuditItem {
  href?: string;
  url?: string;
  text?: string;
  source?: string;
  resourceType?: string;
  label?: string;
  accessibleName?: string;
  wastedMs?: number;
  wastedBytes?: number;
  total?: number;
  duration?: number;
  size?: number;
  value?: number | string;
  node?: LighthouseNode;
}

export interface LighthouseAuditDetails {
  items?: LighthouseAuditItem[];
  type?: string;
}

export interface LighthouseAudit {
  id?: string;
  title?: string;
  description?: string;
  displayValue?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  numericValue?: number;
  details?: LighthouseAuditDetails;
}

export type LighthouseAudits = Record<string, LighthouseAudit | undefined>;

export interface JsonLdRecord {
  [key: string]: unknown;
  '@type'?: string | string[];
  '@graph'?: unknown;
  name?: unknown;
  image?: unknown;
  offers?: unknown;
  sku?: unknown;
}
