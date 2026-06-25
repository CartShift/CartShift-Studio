export interface Finding {
  type: 'positive' | 'issue';
  title: string;
  description: string;
  example?: string;
  source?: AnalysisSource;
  confidence?: AnalysisConfidence;
  scannedUrlScope?: string[];
  exactEvidence?: string[];
  limitation?: string;
}

export interface Recommendation {
  code?: string;
  title: string;
  description?: string;
  action?: string;
  evidence?: string;
  effort?: 'quick' | 'medium' | 'advanced';
  impact: 'high' | 'medium' | 'low';
  serviceLink?: string;
  source?: AnalysisSource;
  confidence?: AnalysisConfidence;
  scannedUrlScope?: string[];
  exactEvidence?: string[];
  limitation?: string;
}

export interface SectionResult {
  name: string;
  score: number;
  status: 'critical' | 'warning' | 'good' | 'excellent';
  findings: Finding[];
  recommendations: Recommendation[];
}

export interface CoreWebVitals {
  lcp?: { value: number; rating: string };
  cls?: { value: number; rating: string };
  fid?: { value: number; rating: string };
}

export type AnalysisConfidence = 'verified' | 'estimated' | 'insufficient_evidence' | 'unavailable';

export type AnalysisSource =
  | 'lighthouse'
  | 'rendered_browser'
  | 'static_html'
  | 'product_sample'
  | 'heuristic';

export type DomainClassification =
  | 'social'
  | 'messaging'
  | 'analytics'
  | 'tag-manager'
  | 'cdn-asset-host'
  | 'schema-standards'
  | 'payment'
  | 'shipping'
  | 'review-platform'
  | 'marketplace'
  | 'affiliate-tracking'
  | 'external-editorial-reference'
  | 'possible-commerce-domain';

export interface Competitor {
  url: string;
  name: string;
  similarityScore: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'detected-link' | 'category-reference';
  overlapReasons: string[];
  domainClassification?: DomainClassification;
  visibleAnchorText?: string[];
  sourcePageSection?: string;
  commerceCategoryOverlap?: string[];
  confidenceScore?: number;
  confidenceFactors?: string[];
}

export interface CompetitorAnalysis {
  competitors: Competitor[];
  marketPosition: 'leader' | 'challenger' | 'niche' | 'unknown';
  category?: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  evidence: string[];
  note?: string;
  source?: AnalysisSource;
  analysisConfidence?: AnalysisConfidence;
  scannedUrlScope?: string[];
  limitations?: string[];
}

export type ProductSchemaCoverageStatus =
  | 'not_scanned'
  | 'not_applicable'
  | 'present'
  | 'partial'
  | 'missing'
  | 'invalid';

export interface ProductSchemaEntityEvidence {
  url: string;
  valid: boolean;
  malformedJsonLd: boolean;
  productCount: number;
  fields: {
    name: boolean;
    image: boolean;
    offers: boolean;
    price: boolean;
    priceCurrency: boolean;
    availability: boolean;
    sku: boolean;
  };
  issues: string[];
}

export interface ScanScope {
  scannedUrls: string[];
  homepageScanned: boolean;
  productPagesScanned: boolean;
  productPageCountAttempted: number;
  productPageCountSucceeded: number;
  productSchemaCoverageStatus: ProductSchemaCoverageStatus;
  productSchemaEvidence?: ProductSchemaEntityEvidence[];
  notes?: string[];
}

export interface Screenshot {
  url: string; // Base64 or URL
  device: 'desktop' | 'mobile';
  label: string;
}

export interface VisualAnalysis {
  screenshots: Screenshot[];
  contrastIssues: number;
  mobileResponsivenessScore: number;
  dominantColors: string[];
}

export interface AIAnalysis {
  score: number;
  label?: 'Content & structured-data readiness';
  confidence?: AnalysisConfidence;
  evidence?: string[];
  limitations?: string[];
  scannedScope?: ScanScope;
  structuredDataTypes: string[];
  openGraphTags: boolean;
  readabilityScore: number; // 0-100
  aiReadinessStatus: 'ready' | 'needs_improvement' | 'not_optimized';
  invalidJsonLdCount?: number;
  canonicalUrlPresent?: boolean;
  languageMetadataPresent?: boolean;
  visibleWordCount?: number;
}

export interface ProductAnalysis {
  productUrl?: string; // If found
  hasBuyButtonAboveFold: boolean;
  imageCount: number;
  hasReviews: boolean;
  descriptionLength: number;
  score: number;
  cartActionabilityStatus: 'detected' | 'clickable' | 'redirected_to_cart' | 'unknown';
}

export interface BenchmarkComparison {
  percentile: number;
  sampleSize: number;
  category: string;
}

export interface AnalysisMeta {
  usedLighthouse: boolean;
  usedHtmlFallback: boolean;
  visualAnalysisAttempted: boolean;
  visualAnalysisAvailable: boolean;
  productAnalysisAvailable: boolean;
  competitorAnalysisAvailable: boolean;
  cached: boolean;
  screenshotsInEmailReport?: boolean;
  emailReportStatus?: 'pending' | 'sent' | 'failed' | 'unconfigured';
  leadCaptureStatus?: 'captured' | 'deduped' | 'failed' | 'unconfigured';
  scanScope?: ScanScope;
}

export interface AnalysisResult {
  storeUrl: string;
  overallScore: number;
  platform: string | null;
  sections: {
    performance: SectionResult;
    seo: SectionResult;
    accessibility: SectionResult;
    bestPractices: SectionResult;
    cart: SectionResult;
    trust: SectionResult;
  };
  coreWebVitals?: CoreWebVitals;
  competitorAnalysis?: CompetitorAnalysis;
  visualAnalysis?: VisualAnalysis;
  aiAnalysis?: AIAnalysis;
  productAnalysis?: ProductAnalysis;
  scanScope?: ScanScope;
  percentile?: number;
  benchmark?: BenchmarkComparison;
  generatedAt: string;
  meta: AnalysisMeta;
}
