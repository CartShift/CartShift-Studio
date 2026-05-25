export interface Finding {
  type: 'positive' | 'issue';
  title: string;
  description: string;
  example?: string;
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

export interface Competitor {
  url: string;
  name: string;
  similarityScore: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'detected-link' | 'category-reference';
  overlapReasons: string[];
}

export interface CompetitorAnalysis {
  competitors: Competitor[];
  marketPosition: 'leader' | 'challenger' | 'niche';
  category?: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  evidence: string[];
  note?: string;
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
  structuredDataTypes: string[];
  openGraphTags: boolean;
  readabilityScore: number; // 0-100
  aiReadinessStatus: 'ready' | 'needs_improvement' | 'not_optimized';
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
  emailReportStatus?: 'sent' | 'failed' | 'unconfigured';
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
  percentile?: number;
  benchmark?: BenchmarkComparison;
  generatedAt: string;
  meta: AnalysisMeta;
}
