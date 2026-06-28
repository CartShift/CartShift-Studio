import {
  AnalysisMeta,
  AnalysisConfidence,
  AnalysisResult,
  AnalysisSource,
  Finding,
  ProductSchemaEntityEvidence,
  ScanScope,
  Recommendation,
  SectionResult,
} from '@/lib/types/analyzer';
import { logError } from '@/lib/error-handler';
import { Logger } from '@/lib/logger';
import { recordAnalyzerServiceFailure } from './analyzer-telemetry';
import { analyzeBestPracticesFallback } from './analyzer-best-practices-fallback';
import { CacheService } from './cache-service';
import { analyzeCartExperience } from './cart-analyzer-advanced';
import { CompetitorService } from './competitor-service';
import { AIReadinessService } from './ai-readiness';
import { BenchmarkService } from './benchmark';
import { ScraperService } from './scraper';
import { safeFetchStoreHtml } from '@/lib/utils/safe-store-fetch';
import { detectPlatform, getScoreStatus } from './analyzer-platform';

const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;
const LIGHTHOUSE_LAB_LIMITATION =
  'Lab measurement. Results can vary by test run, device profile, network, and cached state.';
const PRODUCT_SAMPLE_TARGET_COUNT = 3;

function createRecommendation(
  code: string,
  title: string,
  impact: Recommendation['impact'],
  description: string,
  action: string,
  evidence?: string,
  effort: Recommendation['effort'] = impact === 'high' ? 'medium' : 'quick',
  source: AnalysisSource = 'heuristic',
  confidence: AnalysisConfidence = 'estimated',
  scannedUrlScope: string[] = [],
  limitation?: string
): Recommendation {
  return {
    code,
    title,
    impact,
    description,
    action,
    evidence,
    effort,
    serviceLink: '/contact',
    source,
    confidence,
    scannedUrlScope,
    exactEvidence: evidence ? [evidence] : [],
    limitation,
  };
}

const lighthouseRecommendationMap: Record<
  string,
  {
    title: string;
    description: string;
    action: string;
    effort?: Recommendation['effort'];
  }
> = {
  'meta-description': {
    title: 'Add a search-ready meta description',
    description:
      'Search engines and AI answer engines use the description to understand the page and influence click-through rate.',
    action:
      'Write a unique 140-160 character description for the homepage that names the offer, audience, and primary reason to buy.',
    effort: 'quick',
  },
  'robots-txt': {
    title: 'Fix robots.txt crawl rules',
    description:
      'Invalid robots.txt directives can stop crawlers from discovering important product, category, or asset URLs.',
    action:
      'Validate /robots.txt, remove unsupported directives, and confirm important pages and assets are not blocked.',
    effort: 'quick',
  },
  'color-contrast': {
    title: 'Improve low-contrast text',
    description:
      'Low contrast makes important copy and buttons harder to read, especially on mobile and for users with impaired vision.',
    action:
      'Adjust foreground/background color pairs to meet WCAG AA contrast: 4.5:1 for normal text and 3:1 for large text.',
    effort: 'medium',
  },
  'image-alt': {
    title: 'Add descriptive alt text to images',
    description:
      'Product and content images without alt text lose accessibility context and reduce image-search clarity.',
    action:
      'Add concise alt text to meaningful images and leave purely decorative images empty with alt="".',
    effort: 'medium',
  },
  'button-name': {
    title: 'Name icon-only buttons',
    description:
      'Buttons without accessible names are confusing for screen reader users and automated assistants.',
    action:
      'Add visible text or aria-label values to every button, especially cart, menu, search, and carousel controls.',
    effort: 'quick',
  },
  'link-name': {
    title: 'Make links understandable',
    description:
      'Generic or empty links make navigation unclear and weaken semantic understanding of the page.',
    action:
      'Replace vague link labels with destination-specific text and add aria-labels when an icon is the only visible content.',
    effort: 'quick',
  },
  label: {
    title: 'Connect labels to form fields',
    description:
      'Unlabeled inputs hurt accessibility and can reduce checkout and newsletter form completion.',
    action:
      'Use visible labels or aria-label/aria-labelledby for each form input, select, and textarea.',
    effort: 'quick',
  },
  'server-response-time': {
    title: 'Reduce server response time',
    description:
      'Slow server response delays every later loading milestone and makes paid traffic less efficient.',
    action:
      'Enable page caching, review hosting resources, move heavy plugins/apps off the critical path, and add CDN caching.',
    effort: 'advanced',
  },
  'first-contentful-paint': {
    title: 'Improve initial page-load performance',
    description:
      'Slow first paint delays the first visible confirmation that the storefront is loading.',
    action:
      'Review render-blocking CSS, theme/app scripts, font loading, and the first visible content path before changing product templates.',
    effort: 'medium',
  },
  'largest-contentful-paint': {
    title: 'Speed up the largest visible element',
    description:
      'A slow hero image or main content block delays the moment shoppers feel the page is usable.',
    action:
      'Identify the actual LCP element and its loading path before applying preload or image changes.',
    effort: 'medium',
  },
  'speed-index': {
    title: 'Improve visual load progress',
    description:
      'A slow Speed Index means meaningful content fills in slowly even if the page eventually becomes usable.',
    action:
      'Prioritize above-the-fold HTML/CSS, reduce render-blocking resources, and lazy-load non-critical storefront media.',
    effort: 'medium',
  },
  interactive: {
    title: 'Reduce time to interactive',
    description:
      'A slow interactive milestone means the page appears visible before shoppers can reliably use it.',
    action:
      'Audit scripts required during startup, defer non-critical tags, and reduce work before menus, filters, and product actions are usable.',
    effort: 'advanced',
  },
  'total-blocking-time': {
    title: 'Reduce JavaScript blocking time',
    description:
      'Heavy JavaScript blocks interaction and makes filters, menus, and add-to-cart actions feel laggy.',
    action:
      'Remove unused scripts, defer third-party tags, split large bundles, and audit apps/plugins loaded on every page.',
    effort: 'advanced',
  },
  'mainthread-work-breakdown': {
    title: 'Reduce main-thread work',
    description:
      'Excess main-thread work delays rendering and interaction on mobile devices.',
    action:
      'Identify the largest script, style, layout, and rendering tasks in Lighthouse and remove or defer work that is not needed for initial shopping.',
    effort: 'advanced',
  },
  'cumulative-layout-shift': {
    title: 'Prevent layout shifts',
    description: 'Unexpected movement can cause misclicks and makes product pages feel unstable.',
    action: 'Reserve width/height for images, embeds, banners, and sticky bars before they load.',
    effort: 'medium',
  },
};

interface PageSpeedResult {
  lighthouseResult?: {
    categories?: {
      performance?: { score: number };
      seo?: { score: number };
      accessibility?: { score: number };
      'best-practices'?: { score: number };
    };
    audits?: Record<string, any>;
  };
  loadingExperience?: {
    metrics?: Record<string, { percentile: number; category: string }>;
  };
  error?: { message: string };
}

async function fetchPageSpeedData(url: string): Promise<PageSpeedResult | null> {
  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', url);
    if (PAGESPEED_API_KEY) {
      apiUrl.searchParams.set('key', PAGESPEED_API_KEY);
    }
    apiUrl.searchParams.set('strategy', 'mobile');
    apiUrl.searchParams.set('category', 'performance');
    apiUrl.searchParams.append('category', 'seo');
    apiUrl.searchParams.append('category', 'accessibility');
    apiUrl.searchParams.append('category', 'best-practices');

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.warn('PageSpeed API error', { errorText });
      return null;
    }

    return await response.json();
  } catch (error) {
    Logger.warn('PageSpeed API fetch error', { error });
    return null;
  }
}

function lighthouseEvidenceBase(testedUrl: string) {
  return {
    source: 'lighthouse' as const,
    confidence: 'measured' as const,
    scannedUrlScope: [testedUrl],
    limitation: LIGHTHOUSE_LAB_LIMITATION,
  };
}

function textFromNode(node: any): string {
  if (!node || typeof node !== 'object') return '';
  return String(node.snippet || node.selector || node.nodeLabel || '').replace(/\s+/g, ' ').trim();
}

function classifyLighthouseElementContext(item: any): string {
  const haystack = [
    item?.href,
    item?.url,
    item?.node?.selector,
    item?.node?.snippet,
    item?.node?.nodeLabel,
    item?.text,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/checkout|cart|basket|bag|add-to-cart|single_add_to_cart|product-form/.test(haystack)) {
    return 'cart/checkout or product UI';
  }
  if (/nav|menu|header|primary/.test(haystack)) return 'primary navigation';
  if (/facebook|instagram|tiktok|youtube|pinterest|linkedin|twitter|x\.com|social/.test(haystack)) {
    return 'social links';
  }
  if (/footer/.test(haystack)) return 'footer';
  return 'page content';
}

function getAuditItems(audit: any): any[] {
  return Array.isArray(audit?.details?.items) ? audit.details.items : [];
}

function formatAuditDiagnostics(audit: any, auditId: string, maxItems = 4): string[] {
  const items = getAuditItems(audit).slice(0, maxItems);
  if (!items.length) return [];

  if (auditId === 'link-name') {
    return items.map(item => {
      const context = classifyLighthouseElementContext(item);
      const href = item.href || item.url || item.node?.path || item.node?.selector || 'destination unavailable';
      const snippet = textFromNode(item.node) || item.text || 'link snippet unavailable';
      const name = item.node?.nodeLabel || item.text || item.accessibleName || 'missing or empty';
      return `${context}: ${snippet} -> ${href}; accessible name: ${name}`;
    });
  }

  return items.map(item => {
    const nodeText = textFromNode(item.node);
    const url = item.url || item.source || item.resourceType || item.label || '';
    const value =
      item.wastedMs ||
      item.wastedBytes ||
      item.total ||
      item.duration ||
      item.size ||
      item.value ||
      '';
    return [nodeText || url || audit.title, value ? String(value) : ''].filter(Boolean).join(' - ');
  });
}

function summarizeAuditEvidence(audit: any, auditId: string): { evidence: string; diagnostics: string[] } {
  const diagnostics = formatAuditDiagnostics(audit, auditId);
  const baseEvidence =
    audit.displayValue ||
    audit.description?.split('.')[0] ||
    'The Lighthouse audit did not pass.';

  if (auditId === 'link-name') {
    const items = getAuditItems(audit);
    const count = items.length || Number(audit.numericValue) || 1;
    const contexts = new Set(items.map(classifyLighthouseElementContext));
    return {
      evidence: `${count} affected link${count === 1 ? '' : 's'} found. Contexts: ${
        [...contexts].join(', ') || 'not provided'
      }. ${diagnostics.slice(0, 5).join(' | ')}`,
      diagnostics,
    };
  }

  return {
    evidence: diagnostics.length
      ? `${baseEvidence}. Examples: ${diagnostics.slice(0, 3).join(' | ')}`
      : baseEvidence,
    diagnostics,
  };
}

function linkNameImpact(audit: any): Recommendation['impact'] {
  const items = getAuditItems(audit);
  const contexts = items.map(classifyLighthouseElementContext);
  const hasCriticalPath = contexts.some(context =>
    /primary navigation|cart\/checkout|product UI/.test(context)
  );
  const affectedCount = items.length || Number(audit.numericValue) || 1;

  if (hasCriticalPath || affectedCount >= 10) return 'high';
  if (affectedCount >= 3) return 'medium';
  return 'low';
}

function lcpElementIsImage(audits: Record<string, any>): boolean {
  const items = getAuditItems(audits['largest-contentful-paint-element']);
  return items.some(item => {
    const text = [item?.node?.snippet, item?.node?.selector, item?.url].filter(Boolean).join(' ');
    return /<img|\.(avif|webp|jpe?g|png)(\?|#|$)/i.test(text);
  });
}

function createMeasuredRecommendation(
  auditId: string,
  title: string,
  impact: Recommendation['impact'],
  description: string,
  action: string,
  evidence: string,
  testedUrl: string,
  effort: Recommendation['effort'] = impact === 'high' ? 'medium' : 'quick',
  extras: Partial<Recommendation> = {}
): Recommendation {
  return {
    ...createRecommendation(
      auditId,
      title,
      impact,
      description,
      action,
      evidence,
      effort,
      'lighthouse',
      'measured',
      [testedUrl],
      LIGHTHOUSE_LAB_LIMITATION
    ),
    ...extras,
    source: 'lighthouse',
    confidence: 'measured',
    scannedUrlScope: [testedUrl],
    limitation: LIGHTHOUSE_LAB_LIMITATION,
  };
}

function extractPerformanceLighthouseFindings(
  audits: Record<string, any>,
  testedUrl: string
): { findings: Finding[]; recommendations: Recommendation[] } {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  const evidenceBase = lighthouseEvidenceBase(testedUrl);

  const clusters = [
    {
      id: 'perf-initial-page-load',
      code: 'lighthouse-initial-page-load',
      title: 'Improve initial page-load performance',
      description:
        'Lighthouse measured slow early loading milestones in the tested lab run.',
      auditIds: [
        'first-contentful-paint',
        'largest-contentful-paint',
        'speed-index',
        'interactive',
      ],
      action: lcpElementIsImage(audits)
        ? 'Optimize the LCP image/resource identified by Lighthouse, then reduce render-blocking CSS, fonts, and scripts competing with first paint.'
        : 'Identify the actual LCP element and its loading path before applying preload or image changes.',
      effort: 'medium' as Recommendation['effort'],
    },
    {
      id: 'perf-js-execution',
      code: 'lighthouse-js-execution',
      title: 'Reduce JavaScript execution and main-thread work',
      description:
        'Lighthouse measured JavaScript or rendering work that can delay interaction in the tested lab run.',
      auditIds: ['total-blocking-time', 'mainthread-work-breakdown'],
      action:
        'Use the Lighthouse task breakdown to remove unused theme/app code, defer non-critical third-party tags, and split work that runs before menus, filters, and add-to-cart controls are usable.',
      effort: 'advanced' as Recommendation['effort'],
    },
    {
      id: 'perf-layout-stability',
      code: 'lighthouse-layout-stability',
      title: 'Stabilize layout during load',
      description: 'Lighthouse measured layout movement above the passing threshold.',
      auditIds: ['cumulative-layout-shift'],
      action:
        'Reserve dimensions for images, embeds, banners, and sticky bars identified by Lighthouse before they load.',
      effort: 'medium' as Recommendation['effort'],
    },
    {
      id: 'perf-server-response',
      code: 'lighthouse-server-response',
      title: 'Reduce server response time',
      description: 'Lighthouse measured slow initial server response for the tested page.',
      auditIds: ['server-response-time'],
      action:
        'Review full-page caching, hosting resources, CDN cache rules, and plugins/apps that run before the first HTML response.',
      effort: 'advanced' as Recommendation['effort'],
    },
  ];

  for (const cluster of clusters) {
    const failedAudits = cluster.auditIds
      .map(auditId => [auditId, audits[auditId]] as const)
      .filter(([, audit]) => audit && audit.score !== null && audit.score < 0.9);

    for (const audit of cluster.auditIds.map(auditId => audits[auditId])) {
      if (!audit || audit.scoreDisplayMode === 'notApplicable' || audit.scoreDisplayMode === 'informative') {
        continue;
      }

      findings.push({
        type: audit.score === 1 ? 'positive' : audit.score !== null && audit.score < 0.9 ? 'issue' : 'positive',
        title: audit.title,
        description: audit.score === 1 ? 'Passed' : audit.displayValue || 'Measured by Lighthouse.',
        ...evidenceBase,
        exactEvidence: [audit.displayValue || audit.description || audit.title],
      });
    }

    if (!failedAudits.length) continue;

    const measuredMetrics = Object.fromEntries(
      failedAudits.map(([auditId, audit]) => [
        auditId,
        audit.displayValue || (typeof audit.numericValue === 'number' ? String(audit.numericValue) : 'failed'),
      ])
    );
    const diagnostics = failedAudits.flatMap(([auditId, audit]) =>
      formatAuditDiagnostics(audit, auditId, 2)
    );
    const evidence = `Measured metrics: ${Object.entries(measuredMetrics)
      .map(([auditId, value]) => `${audits[auditId]?.title || auditId}: ${value}`)
      .join('; ')}. Affected audits: ${failedAudits.map(([auditId]) => auditId).join(', ')}.${
      diagnostics.length ? ` Diagnostics: ${diagnostics.slice(0, 4).join(' | ')}` : ''
    }`;
    const impact = failedAudits.some(([, audit]) => audit.score < 0.5) ? 'high' : 'medium';

    recommendations.push(
      createMeasuredRecommendation(
        cluster.code,
        cluster.title,
        impact,
        cluster.description,
        cluster.action,
        evidence,
        testedUrl,
        cluster.effort,
        {
          rootCauseId: cluster.id,
          measuredMetrics,
          affectedAuditIds: failedAudits.map(([auditId]) => auditId),
          diagnostics,
          exactEvidence: [evidence],
        }
      )
    );
  }

  return { findings, recommendations };
}

function extractLighthouseFindings(
  audits: Record<string, any>,
  category: string,
  testedUrl: string
): { findings: Finding[]; recommendations: Recommendation[] } {
  if (category === 'performance') {
    return extractPerformanceLighthouseFindings(audits, testedUrl);
  }

  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  const evidenceBase = lighthouseEvidenceBase(testedUrl);

  const categoryAudits: Record<string, string[]> = {
    performance: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'total-blocking-time',
      'cumulative-layout-shift',
      'server-response-time',
      'interactive',
      'mainthread-work-breakdown',
    ],
    seo: [
      'document-title',
      'meta-description',
      'http-status-code',
      'crawlable-anchors',
      'is-crawlable',
      'robots-txt',
      'link-text',
      'image-alt',
    ],
    accessibility: [
      'button-name',
      'color-contrast',
      'image-alt',
      'link-name',
      'label',
      'form-field-multiple-labels',
    ],
    'best-practices': [
      'is-on-https',
      'uses-http2',
      'no-vulnerable-libraries',
      'doctype',
      'charset',
    ],
  };

  const auditsToCheck = categoryAudits[category] || [];

  for (const auditId of auditsToCheck) {
    const audit = audits[auditId];
    if (
      !audit ||
      audit.scoreDisplayMode === 'notApplicable' ||
      audit.scoreDisplayMode === 'informative'
    )
      continue;

    if (audit.score === 1) {
      findings.push({
        type: 'positive',
        title: audit.title,
        description: 'Passed',
        ...evidenceBase,
        exactEvidence: [audit.displayValue || audit.title],
      });
    } else if (audit.score !== null && audit.score < 0.9) {
      const recommendation = lighthouseRecommendationMap[auditId];
      const impact = auditId === 'link-name' ? linkNameImpact(audit) : audit.score < 0.5 ? 'high' : 'medium';
      const { evidence, diagnostics } = summarizeAuditEvidence(audit, auditId);

      findings.push({
        type: 'issue',
        title: audit.title,
        description: evidence,
        ...evidenceBase,
        exactEvidence: [evidence],
      });
      recommendations.push(
        recommendation
          ? createMeasuredRecommendation(
              auditId,
              recommendation.title,
              impact,
              recommendation.description,
              recommendation.action,
              evidence,
              testedUrl,
              recommendation.effort,
              {
                rootCauseId: `lighthouse-${auditId}`,
                affectedAuditIds: [auditId],
                diagnostics,
                exactEvidence: [evidence],
              }
            )
          : createMeasuredRecommendation(
              auditId,
              audit.title
                .replace('Ensure', 'Fix')
                .replace('Avoid', 'Remove')
                .replace('Eliminate', 'Fix'),
              impact,
              audit.description?.split('.')[0] || 'This audit did not meet Lighthouse standards.',
              'Review the specific Lighthouse audit examples above and update the affected storefront template, theme asset, or component.',
              evidence,
              testedUrl,
              'medium',
              {
                rootCauseId: `lighthouse-${auditId}`,
                affectedAuditIds: [auditId],
                diagnostics,
                exactEvidence: [evidence],
              }
            )
      );
    }
  }

  return { findings, recommendations };
}

/** Static HTML analysis when full (Puppeteer) analysis is unavailable. */
function analyzeSEOFallback(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50;

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1].trim().length > 0) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Page title found',
      description: 'HTML title tag is present.',
    });
  } else {
    findings.push({
      type: 'issue',
      title: 'Missing page title',
      description: 'Title tag is empty or missing.',
    });
    recommendations.push(
      createRecommendation(
        'document-title',
        'Add a descriptive page title',
        'high',
        'The page title is one of the strongest signals for search listings and browser tabs.',
        'Add a unique title under 60 characters that includes the store name and main product/category promise.',
        'No non-empty <title> tag was found.',
        'quick'
      )
    );
  }

  const metaDescMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (metaDescMatch && metaDescMatch[1].trim().length > 0) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Meta description found',
      description: 'Meta description is present.',
    });
  } else {
    findings.push({
      type: 'issue',
      title: 'Missing meta description',
      description: 'Add a meta description.',
    });
    recommendations.push(
      createRecommendation(
        'meta-description',
        'Add a search-ready meta description',
        'high',
        'Search engines and AI answer engines use the description to understand the page and influence click-through rate.',
        'Write a unique 140-160 character description for the homepage that names the offer, audience, and primary reason to buy.',
        'No meta description was found.',
        'quick'
      )
    );
  }

  const h1Status = analyzeH1Static(html);
  if (h1Status.status === 'single_static') {
    score += 10;
    findings.push({
      type: 'positive',
      title: h1Status.title,
      description: h1Status.description,
    });
  } else {
    findings.push({
      type: 'issue',
      title: h1Status.title,
      description: h1Status.description,
    });
    recommendations.push(
      createRecommendation(
        'h1',
        'Add one clear H1 heading',
        'medium',
        'A clear H1 helps shoppers, search engines, and assistive technologies understand the page topic.',
        'Add one visible H1 near the top of the homepage that describes the store or primary collection.',
        h1Status.description,
        'quick',
        'static_html',
        'estimated',
        [],
        'Static HTML cannot verify which heading is visible after responsive CSS and JavaScript render.'
      )
    );
  }

  return {
    name: 'SEO',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzePerformanceFallback(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 60;

  const scriptCount = (html.match(/<script/gi) || []).length;
  const externalScripts = [...html.matchAll(/<script\b([^>]*)\bsrc=["']([^"']+)["'][^>]*>/gi)];
  const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  const inlineJsSize = inlineScripts.reduce((sum, match) => sum + match[1].length, 0);
  const blockingHeadScripts =
    (html.match(/<head[\s\S]*?<\/head>/i)?.[0].match(
      /<script\b(?![^>]*(async|defer|type=["']module["']))[^>]*\bsrc=/gi
    ) || []).length;
  const deferredScripts = externalScripts.filter(match =>
    /\b(async|defer|type=["']module["'])/i.test(match[1])
  ).length;
  const knownThirdPartyDomains = externalScripts
    .map(match => {
      try {
        return new URL(match[2]).hostname.replace(/^www\./, '');
      } catch {
        return '';
      }
    })
    .filter(domain =>
      /google|facebook|tiktok|klaviyo|mailchimp|hotjar|doubleclick|yotpo|trustpilot|shopifycdn|cloudflare/i.test(
        domain
      )
    );

  if (scriptCount > 20) {
    score -= 5;
    findings.push({
      type: 'issue',
      title: 'Many script references detected',
      description:
        'The page contains many script references, but runtime impact could not be verified without Lighthouse data.',
      source: 'static_html',
      confidence: 'estimated',
      exactEvidence: [
        `${scriptCount} script tags`,
        `${externalScripts.length} external script src URLs`,
        `${blockingHeadScripts} potentially blocking head scripts`,
      ],
      limitation:
        'Script count is an HTML-only diagnostic. It does not prove render blocking, interaction delay, or slow menus.',
    });
  } else {
    findings.push({
      type: 'positive',
      title: 'Reasonable script usage',
      description: 'Script tag count is normal.',
    });
  }

  if (/loading=["']lazy["']/i.test(html)) {
    score += 10;
    findings.push({
      type: 'positive',
      title: 'Lazy loading detected',
      description: 'Images use lazy loading.',
    });
  } else {
    recommendations.push(
      createRecommendation(
        'lazy-loading',
        'Lazy load below-fold images',
        'medium',
        'Images below the first viewport should not compete with critical content for initial bandwidth.',
        'Add loading="lazy" to below-fold images while keeping the hero image eager/preloaded.',
        'No lazy-loaded images were detected in the static HTML.',
        'quick'
      )
    );
  }

  const independentRiskSignals = [
    scriptCount > 35,
    externalScripts.length > 25,
    inlineJsSize > 150_000,
    blockingHeadScripts > 8,
    knownThirdPartyDomains.length > 8,
  ].filter(Boolean).length;

  if (independentRiskSignals >= 3) {
    recommendations.push(
      createRecommendation(
        'script-count',
        'Review storefront JavaScript weight',
        'medium',
        'Multiple static HTML signals suggest JavaScript weight may deserve a runtime performance audit.',
        'Run Lighthouse or WebPageTest, then remove unused app/theme scripts and defer non-critical third-party tags confirmed to affect loading or interaction.',
        `${scriptCount} script tags, ${externalScripts.length} external scripts, ${Math.round(
          inlineJsSize / 1024
        )} KiB inline JavaScript, ${blockingHeadScripts} potentially blocking head scripts, ${deferredScripts} async/defer/module scripts.`,
        'advanced',
        'static_html',
        'estimated',
        [],
        'Static HTML can estimate script exposure but cannot verify Total Blocking Time, main-thread work, or render-blocking impact.'
      )
    );
  }

  return {
    name: 'Performance',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzeAccessibilityFallback(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50;

  if (/html[^>]+lang=/i.test(html)) {
    score += 25;
    findings.push({
      type: 'positive',
      title: 'Language attribute',
      description: 'HTML tag specifies a language.',
    });
  } else {
    recommendations.push(
      createRecommendation(
        'html-lang',
        'Set the page language',
        'high',
        'Language metadata helps screen readers pronounce content correctly and helps search engines classify the page.',
        'Add the correct lang attribute to the <html> element, such as lang="he" or lang="en".',
        'No html lang attribute was detected.',
        'quick'
      )
    );
  }

  if (/<meta[^>]+name=["']viewport["']/i.test(html)) {
    score += 25;
    findings.push({
      type: 'positive',
      title: 'Mobile optimization',
      description: 'Viewport meta tag is present.',
    });
  } else {
    recommendations.push(
      createRecommendation(
        'viewport',
        'Add a mobile viewport tag',
        'high',
        'Without a viewport tag, mobile browsers may render the store at desktop width and create a poor shopping experience.',
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the document head.',
        'No viewport meta tag was detected.',
        'quick'
      )
    );
  }

  const imgCount = (html.match(/<img/gi) || []).length;
  const altCount = (html.match(/alt=["'][^"']*["']/gi) || []).length;

  if (imgCount > 0 && altCount >= imgCount * 0.8) {
    score += 20;
    findings.push({
      type: 'positive',
      title: 'Image alt text',
      description: 'Most images have description tags.',
    });
  } else if (imgCount > 0) {
    recommendations.push(
      createRecommendation(
        'image-alt',
        'Add descriptive alt text to images',
        'medium',
        'Product and content images without alt text lose accessibility context and reduce image-search clarity.',
        'Add concise alt text to meaningful images and leave purely decorative images empty with alt="".',
        `${altCount} of ${imgCount} images include alt text.`,
        'medium'
      )
    );
  } else {
    score += 20;
  }

  return {
    name: 'Accessibility',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function analyzeTrust(html: string): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 50;

  const reviewTerms = /review|rating|star|testimonial|feedback/i;
  if (reviewTerms.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Social proof detected',
      description: 'Reviews or ratings found.',
    });
    score += 20;
  } else {
    recommendations.push(
      createRecommendation(
        'reviews',
        'Show customer reviews or ratings',
        'high',
        'Social proof helps new shoppers validate quality, sizing, service, and delivery confidence.',
        'Add review snippets, star ratings, testimonials, or UGC near product and collection decision points.',
        'No review, rating, testimonial, or feedback language was detected.',
        'medium'
      )
    );
  }

  if (/privacy/i.test(html) && /policy/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Privacy policy found',
      description: 'Legal pages appear to be linked.',
    });
    score += 15;
  } else {
    recommendations.push(
      createRecommendation(
        'privacy-policy',
        'Make privacy policy visible',
        'medium',
        'Visible policies build trust and help shoppers understand how their information is handled.',
        'Link privacy, returns, shipping, and terms pages from the footer and checkout-adjacent areas.',
        'A clear privacy policy link was not detected.',
        'quick'
      )
    );
  }

  if (/trust|secure|badge|guarantee|payment|visa|mastercard|paypal/i.test(html)) {
    findings.push({
      type: 'positive',
      title: 'Trust signals detected',
      description: 'Payment/Security icons found.',
    });
    score += 15;
  }

  return {
    name: 'Trust & Credibility',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}

function addRecommendationOnce(section: SectionResult, recommendation: Recommendation) {
  if (section.recommendations.some(rec => rec.code === recommendation.code)) {
    return;
  }
  section.recommendations.push(recommendation);
}

function addFindingOnce(section: SectionResult, title: string, description: string) {
  if (section.findings.some(finding => finding.title === title)) {
    return;
  }
  section.findings.push({
    type: 'issue',
    title,
    description,
  });
}

function lowerSectionScore(section: SectionResult, score: number) {
  section.score = Math.max(0, Math.min(section.score, score));
  section.status = getScoreStatus(section.score);
}

function applyEvidenceDefaults(
  sections: AnalysisResult['sections'],
  source: AnalysisSource,
  confidence: AnalysisConfidence,
  scannedUrlScope: string[],
  limitation?: string
) {
  Object.values(sections).forEach(section => {
    section.findings = section.findings.map(finding => ({
      ...finding,
      source: finding.source ?? source,
      confidence: finding.confidence ?? confidence,
      scannedUrlScope: finding.scannedUrlScope ?? scannedUrlScope,
      exactEvidence: finding.exactEvidence ?? [finding.description].filter(Boolean),
      limitation: finding.limitation ?? limitation,
    }));

    section.recommendations = section.recommendations.map(rec => ({
      ...rec,
      source: rec.source ?? source,
      confidence: rec.confidence ?? confidence,
      scannedUrlScope: rec.scannedUrlScope ?? scannedUrlScope,
      exactEvidence: rec.exactEvidence ?? (rec.evidence ? [rec.evidence] : []),
      limitation: rec.limitation ?? limitation,
    }));
  });
}

function stripHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function analyzeH1Static(html: string) {
  const matches = [...html.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
  const visibleMatches = matches.filter(match => {
    const attrs = match[1] || '';
    const text = stripHtmlText(match[2] || '');
    const hidden =
      /\bhidden\b/i.test(attrs) ||
      /aria-hidden=["']true["']/i.test(attrs) ||
      /display\s*:\s*none/i.test(attrs) ||
      /visibility\s*:\s*hidden/i.test(attrs) ||
      /\bsr-only\b/i.test(attrs);
    return text.length > 0 && !hidden;
  });

  if (matches.length === 0) {
    return {
      status: 'missing_raw',
      title: 'No H1 in static HTML',
      description: 'No visible H1 could be confirmed from static HTML.',
    };
  }

  if (visibleMatches.length === 0) {
    return {
      status: 'hidden_only',
      title: 'H1 appears hidden in static HTML',
      description: 'H1 markup exists, but no visible H1 could be confirmed from static HTML.',
    };
  }

  const visibleTexts = visibleMatches.map(match => stripHtmlText(match[2] || '').toLowerCase());
  const uniqueTexts = new Set(visibleTexts);
  if (visibleMatches.length > 1 && uniqueTexts.size === 1) {
    return {
      status: 'duplicated_hidden_responsive',
      title: 'H1 found in duplicated responsive templates',
      description:
        'Multiple matching H1 elements were found in static HTML; rendered browser verification is needed to confirm the visible heading.',
    };
  }

  if (visibleMatches.length > 1) {
    return {
      status: 'multiple',
      title: 'Multiple H1 headings in static HTML',
      description:
        'Multiple H1 elements were found in static HTML; rendered browser verification is needed before making a definitive accessibility claim.',
    };
  }

  return {
    status: 'single_static',
    title: 'H1 heading found in static HTML',
    description:
      'A non-empty H1 exists in static HTML, but visibility was not verified in a rendered browser DOM.',
  };
}

function absoluteUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function detectProductPageCandidates(html: string, baseUrl: string, platform: string | null): string[] {
  const candidates = new Set<string>();
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  const origin = new URL(baseUrl).origin;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const url = absoluteUrl(href, baseUrl);
    if (!url) continue;
    const parsed = new URL(url);
    if (parsed.origin !== origin) continue;
    const path = parsed.pathname.toLowerCase().replace(/\/+$/, '/');
    const query = parsed.search.toLowerCase();
    const archiveOrUtility =
      /^\/(shop|cart|checkout|account|my-account|search)\/?$/.test(path) ||
      /\/product-category\/|\/collections\/?$|\/collections\/[^/]+\/?$|\/category\//i.test(path) ||
      /(^|[?&])(s|search|add-to-cart)=/i.test(query);
    if (archiveOrUtility) continue;

    const looksLikeProduct =
      /\/products?\//i.test(path) ||
      /\/product\//i.test(path) ||
      (platform === 'WooCommerce' && /\/shop\/[^/?#]+\/?$/i.test(path)) ||
      (platform === 'Shopify' && /\/products\//i.test(path));

    if (looksLikeProduct) {
      parsed.hash = '';
      candidates.add(parsed.toString());
    }
  }

  if (/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"?Product/i.test(html)) {
    candidates.add(baseUrl);
  }

  return [...candidates].slice(0, 8);
}

function extractJsonLdBlocks(html: string): string[] {
  return [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    ),
  ].map(match => match[1].trim());
}

function collectProductEntities(value: unknown, products: Record<string, any>[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach(item => collectProductEntities(item, products));
    return;
  }
  if (typeof value !== 'object') return;

  const record = value as Record<string, any>;
  const type = record['@type'];
  const types = Array.isArray(type) ? type : [type];
  if (types.some(item => typeof item === 'string' && item.toLowerCase() === 'product')) {
    products.push(record);
  }
  if (record['@graph']) collectProductEntities(record['@graph'], products);
}

function hasOfferField(product: Record<string, any>, field: string): boolean {
  const offers = product.offers;
  const offerList = Array.isArray(offers) ? offers : offers ? [offers] : [];
  return offerList.some(offer => {
    if (!offer || typeof offer !== 'object') return false;
    if (field in offer) return Boolean(offer[field]);
    if (field === 'price' && 'lowPrice' in offer) return Boolean(offer.lowPrice);
    return false;
  });
}

function detectMicrodataProductFields(html: string) {
  const productScopes = [
    ...html.matchAll(
      /<[^>]+(?:itemscope|typeof=["'][^"']*Product[^"']*["'])[^>]*(?:itemtype=["'][^"']*schema\.org\/Product[^"']*["'])?[\s\S]*?(?=<[^>]+(?:itemscope|typeof=)|<\/body>|$)/gi
    ),
  ].map(match => match[0]);
  const microdataProductCount = (html.match(/itemtype=["'][^"']*schema\.org\/Product[^"']*["']/gi) || [])
    .length;
  const rdfaProductCount = (html.match(/typeof=["'][^"']*Product[^"']*["']/gi) || []).length;
  const scopeText = productScopes.join('\n') || html;

  return {
    microdataProductCount,
    rdfaProductCount,
    fields: {
      name: /itemprop=["']name["']|property=["']name["']/i.test(scopeText),
      image: /itemprop=["']image["']|property=["']image["']/i.test(scopeText),
      offers: /itemprop=["']offers["']|property=["']offers["']|schema\.org\/Offer/i.test(scopeText),
      price: /itemprop=["']price["']|property=["']price["']/i.test(scopeText),
      priceCurrency:
        /itemprop=["']priceCurrency["']|property=["']priceCurrency["']|content=["'][A-Z]{3}["']/i.test(
          scopeText
        ),
      availability: /itemprop=["']availability["']|property=["']availability["']/i.test(scopeText),
      sku: /itemprop=["']sku["']|property=["']sku["']|itemprop=["']mpn["']|gtin/i.test(scopeText),
    },
  };
}

function confirmProductDetailPage(html: string, url: string, platform: string | null): {
  confirmed: boolean;
  signals: string[];
} {
  const path = new URL(url).pathname.toLowerCase().replace(/\/+$/, '/');
  const blocked =
    /^\/(shop|cart|checkout|account|my-account|search)\/?$/.test(path) ||
    /\/product-category\/|\/collections\/?$|\/category\//i.test(path);
  if (blocked) {
    return { confirmed: false, signals: ['URL is an archive, category, search, cart, checkout, or account page.'] };
  }

  const signals: string[] = [];
  if (/<body[^>]+class=["'][^"']*single-product[^"']*["']/i.test(html)) {
    signals.push('WooCommerce single-product body class');
  }
  if (/class=["'][^"']*(product_title|entry-title)[^"']*["']/i.test(html)) {
    signals.push('Product title marker');
  }
  if (/class=["'][^"']*(cart|single_add_to_cart_button)[^"']*["']|name=["']add-to-cart["']/i.test(html)) {
    signals.push('Add-to-cart form or button');
  }
  if (/woocommerce-Price-amount|itemprop=["']price["']|class=["'][^"']*price[^"']*["']/i.test(html)) {
    signals.push('Price marker');
  }
  if (/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"?Product/i.test(html)) {
    signals.push('Product JSON-LD');
  }
  if (/itemtype=["'][^"']*schema\.org\/Product[^"']*["']|typeof=["'][^"']*Product[^"']*["']/i.test(html)) {
    signals.push('Product Microdata/RDFa');
  }
  if (platform === 'Shopify' && /\/products\//i.test(path) && /product-form|name=["']id["']|add-to-cart/i.test(html)) {
    signals.push('Shopify product form markers');
  }

  return { confirmed: signals.length >= 2, signals };
}

function validateProductSchema(html: string, url: string): ProductSchemaEntityEvidence {
  const blocks = extractJsonLdBlocks(html);
  const products: Record<string, any>[] = [];
  let malformedJsonLd = false;

  for (const block of blocks) {
    try {
      collectProductEntities(JSON.parse(block), products);
    } catch {
      malformedJsonLd = true;
    }
  }
  const microdata = detectMicrodataProductFields(html);
  const hasProductMarkup =
    products.length > 0 || microdata.microdataProductCount > 0 || microdata.rdfaProductCount > 0;

  const fields = {
    name: products.some(product => Boolean(product.name)) || microdata.fields.name,
    image: products.some(product => Boolean(product.image)) || microdata.fields.image,
    offers: products.some(product => Boolean(product.offers)) || microdata.fields.offers,
    price: products.some(product => hasOfferField(product, 'price')) || microdata.fields.price,
    priceCurrency:
      products.some(product => hasOfferField(product, 'priceCurrency')) ||
      microdata.fields.priceCurrency,
    availability:
      products.some(product => hasOfferField(product, 'availability')) ||
      microdata.fields.availability,
    sku: products.some(product => Boolean(product.sku || product.mpn || product.gtin)) || microdata.fields.sku,
  };

  const issues: string[] = [];
  if (malformedJsonLd) issues.push('Malformed JSON-LD was detected outside confirmed Product markup.');
  if (products.length === 0) issues.push('No Product JSON-LD entity was found in source HTML.');
  if (hasProductMarkup) {
    if (!fields.name) issues.push('Product schema is missing name.');
    if (!fields.image) issues.push('Product schema is missing image.');
    if (!fields.offers) issues.push('Product schema is missing offers.');
    if (!fields.price) issues.push('Product offers are missing price.');
    if (!fields.priceCurrency) issues.push('Product offers are missing priceCurrency.');
  }

  return {
    url,
    valid:
      hasProductMarkup &&
      fields.name &&
      fields.image &&
      fields.offers &&
      fields.price &&
      fields.priceCurrency,
    malformedJsonLd,
    malformedJsonLdUnrelated: malformedJsonLd && hasProductMarkup,
    productCount: products.length + microdata.microdataProductCount + microdata.rdfaProductCount,
    jsonLdProductCount: products.length,
    microdataProductCount: microdata.microdataProductCount,
    rdfaProductCount: microdata.rdfaProductCount,
    markupFormats: [
      ...(products.length ? (['json_ld'] as const) : []),
      ...(microdata.microdataProductCount ? (['microdata'] as const) : []),
      ...(microdata.rdfaProductCount ? (['rdfa'] as const) : []),
    ],
    fields,
    issues,
  };
}

async function fetchWithSingleRetry(url: string, timeoutMs: number) {
  try {
    return await safeFetchStoreHtml(url, timeoutMs);
  } catch (firstError) {
    Logger.warn('Product sample fetch failed, retrying once', { url, firstError });
    return safeFetchStoreHtml(url, timeoutMs);
  }
}

async function buildScanScope(
  homepageHtml: string,
  homepageUrl: string,
  platform: string | null
): Promise<ScanScope> {
  const productCandidates = detectProductPageCandidates(homepageHtml, homepageUrl, platform).slice(
    0,
    PRODUCT_SAMPLE_TARGET_COUNT
  );
  const scannedUrls = [homepageUrl];

  if (productCandidates.length === 0) {
    return {
      scannedUrls,
      homepageScanned: true,
      productPagesScanned: false,
      productPageCountAttempted: 0,
      productPageCountSucceeded: 0,
      productSchemaCoverageStatus: 'not_scanned',
      productSchemaEvidence: [],
      notes: ['Product pages were not scanned, so product schema coverage could not be verified.'],
    };
  }

  const evidence: ProductSchemaEntityEvidence[] = [];
  let succeeded = 0;

  for (const productUrl of productCandidates) {
    try {
      const fetched = await fetchWithSingleRetry(productUrl, 8000);
      scannedUrls.push(fetched.finalUrl);
      const confirmation = confirmProductDetailPage(fetched.html, fetched.finalUrl, platform);
      if (!confirmation.confirmed) {
        Logger.info('Product page candidate rejected after fetch', {
          productUrl,
          finalUrl: fetched.finalUrl,
          signals: confirmation.signals,
        });
        continue;
      }
      succeeded += 1;
      evidence.push({
        ...validateProductSchema(fetched.html, fetched.finalUrl),
        confirmedProductPage: true,
        confirmationSignals: confirmation.signals,
      });
    } catch (error) {
      Logger.warn('Product page sample failed', { productUrl, error });
    }
  }

  let status: ScanScope['productSchemaCoverageStatus'] = 'not_scanned';
  if (succeeded === 0) {
    status = 'not_verified';
  } else if (succeeded < PRODUCT_SAMPLE_TARGET_COUNT) {
    status = 'not_verified';
  } else if (evidence.some(item => item.jsonLdProductCount && !item.valid && !item.malformedJsonLdUnrelated)) {
    status = 'invalid';
  } else if (evidence.every(item => item.valid)) {
    status = 'present';
  } else if (
    evidence.some(item => item.valid || item.productCount > 0) &&
    evidence.some(item => item.productCount === 0)
  ) {
    status = 'partial';
  } else {
    status = 'missing';
  }

  return {
    scannedUrls: [...new Set(scannedUrls)],
    homepageScanned: true,
    productPagesScanned: succeeded > 0,
    productPageCountAttempted: productCandidates.length,
    productPageCountSucceeded: succeeded,
    productSchemaCoverageStatus: status,
    productSchemaEvidence: evidence,
    notes:
      succeeded > 0
        ? [
            `Confirmed ${succeeded} of ${PRODUCT_SAMPLE_TARGET_COUNT} requested product page sample(s).`,
            ...(succeeded < PRODUCT_SAMPLE_TARGET_COUNT
              ? ['Product schema coverage is not verified because fewer than the requested sample count could be confirmed.']
              : []),
          ]
        : ['Product page candidates were found, but none could be confirmed as product detail pages.'],
  };
}

function defaultScanScope(url: string, existing?: Partial<ScanScope>): ScanScope {
  return {
    scannedUrls: existing?.scannedUrls?.length ? existing.scannedUrls : [url],
    homepageScanned: existing?.homepageScanned ?? true,
    productPagesScanned: existing?.productPagesScanned ?? false,
    productPageCountAttempted: existing?.productPageCountAttempted ?? 0,
    productPageCountSucceeded: existing?.productPageCountSucceeded ?? 0,
    productSchemaCoverageStatus: existing?.productSchemaCoverageStatus ?? 'not_scanned',
    productSchemaEvidence: existing?.productSchemaEvidence ?? [],
    notes:
      existing?.notes ??
      ['Product pages were not scanned, so product schema coverage could not be verified.'],
  };
}

function unavailableDeeperScan(reason: string): AnalysisResult['deeperScan'] {
  return {
    attempted: true,
    available: false,
    categoryPagesAttempted: 0,
    categoryPagesSucceeded: 0,
    productPagesAttempted: 0,
    productPagesSucceeded: 0,
    cartInteractionAttempted: false,
    cartInteractionSucceeded: false,
    categorySamples: [],
    productSamples: [],
    confidence: 'unavailable',
    limitations: [reason],
  };
}

function firstLimitation(deeperScan?: AnalysisResult['deeperScan']) {
  return deeperScan?.limitations?.find(Boolean);
}

function buildFeatureAvailability(params: {
  usedLighthouse: boolean;
  usedHtmlFallback: boolean;
  visualAnalysisAttempted: boolean;
  visualData?: AnalysisResult['visualAnalysis'] | null;
  productData?: AnalysisResult['productAnalysis'];
  deeperScanData?: AnalysisResult['deeperScan'];
  competitorData: NonNullable<AnalysisResult['competitorAnalysis']>;
}): NonNullable<AnalysisMeta['featureAvailability']> {
  const {
    usedLighthouse,
    usedHtmlFallback,
    visualAnalysisAttempted,
    visualData,
    productData,
    deeperScanData,
    competitorData,
  } = params;
  const deepScanReason = firstLimitation(deeperScanData);
  const browserPathAttempted = visualAnalysisAttempted || Boolean(deeperScanData?.attempted);
  const productAttempted = Boolean(deeperScanData?.productPagesAttempted);
  const browserFailureCode =
    !browserPathAttempted
      ? 'browser_disabled'
      : deepScanReason?.toLowerCase().includes('launch')
        ? 'browser_launch_failed'
        : deepScanReason?.toLowerCase().includes('automation')
          ? 'browser_sampling_failed'
          : undefined;
  const productReason =
    productData
      ? undefined
      : !browserPathAttempted
        ? 'Browser automation is disabled for this runtime.'
        : deepScanReason ||
          (productAttempted
            ? 'Product page candidates were discovered, but product sampling did not complete.'
            : 'No same-origin product URLs were discovered from visible homepage links.');
  const competitorsAvailable = competitorData.analysisConfidence !== 'unavailable';

  return {
    lighthouse: {
      attempted: true,
      available: usedLighthouse,
      reasonCode: usedLighthouse ? undefined : 'pagespeed_unavailable',
      reason: usedLighthouse
        ? undefined
        : usedHtmlFallback
          ? 'Lighthouse/PageSpeed was unavailable, so static HTML fallback checks were used.'
          : 'Lighthouse/PageSpeed did not return usable data.',
    },
    visual: {
      attempted: visualAnalysisAttempted,
      available: Boolean(visualData),
      reasonCode: visualData
        ? undefined
        : !browserPathAttempted
          ? 'browser_disabled'
          : deepScanReason?.toLowerCase().includes('launch')
            ? 'browser_launch_failed'
            : 'browser_sampling_failed',
      reason: visualData
        ? undefined
        : !browserPathAttempted
          ? 'Browser automation is disabled for this runtime.'
          : deepScanReason || 'Browser automation did not return usable visual capture data.',
    },
    product: {
      attempted: visualAnalysisAttempted || productAttempted,
      available: Boolean(productData),
      reasonCode: productData
        ? undefined
        : browserFailureCode ||
          (productAttempted
            ? 'product_sampling_failed'
            : 'no_product_urls'),
      reason: productReason,
    },
    deeperScan: {
      attempted: deeperScanData?.attempted ?? visualAnalysisAttempted,
      available: Boolean(deeperScanData?.available),
      reasonCode: deeperScanData?.available
        ? undefined
        : !browserPathAttempted
          ? 'browser_disabled'
          : deepScanReason?.toLowerCase().includes('launch')
            ? 'browser_launch_failed'
            : deepScanReason?.toLowerCase().includes('automation')
              ? 'browser_sampling_failed'
              : 'deep_scan_no_samples',
      reason: deeperScanData?.available
        ? undefined
        : deepScanReason || 'Deep scan did not collect usable category, product, or cart samples.',
      limitations: deeperScanData?.limitations,
    },
    competitors: {
      attempted: true,
      available: competitorsAvailable,
      reasonCode: competitorsAvailable
        ? competitorData.competitors.length > 0
          ? undefined
          : 'competitor_no_verified_data'
        : 'competitor_failed',
      reason: competitorsAvailable
        ? competitorData.competitors.length > 0
          ? undefined
          : 'Competitor analysis ran, but no direct competitors could be identified confidently.'
        : 'Competitor analysis failed before producing usable evidence.',
      limitations: competitorData.limitations,
    },
  };
}

function suppressLegacyCompetitors(result: AnalysisResult, scanScope: ScanScope) {
  if (
    !result.competitorAnalysis?.competitors?.some(comp => !comp.domainClassification)
  ) {
    return result.competitorAnalysis;
  }

  return {
    ...result.competitorAnalysis,
    competitors: [],
    marketPosition: 'unknown' as const,
    confidence: 'low' as const,
    summary: 'No direct competitors could be identified confidently from the scanned page.',
    analysisConfidence: 'insufficient_evidence' as const,
    scannedUrlScope: scanScope.scannedUrls,
    limitations: [
      'Legacy cached competitor candidates did not include evidence fields and were suppressed.',
    ],
  };
}

function enrichSectionsWithVisualSignals(
  sections: AnalysisResult['sections'],
  visualData: AnalysisResult['visualAnalysis']
) {
  if (!visualData) return;

  if (visualData.contrastIssues > 0) {
    const evidence = `${visualData.contrastIssues} potential low-contrast text pair${
      visualData.contrastIssues === 1 ? '' : 's'
    } were detected during visual capture.`;

    addFindingOnce(sections.accessibility, 'Visual contrast risks detected', evidence);
    addRecommendationOnce(
      sections.accessibility,
      createRecommendation(
        'visual-contrast-audit',
        'Fix visible contrast risks',
        'high',
        'Low contrast makes merchandising, pricing, and checkout copy harder to read on real devices.',
        'Review the captured page against WCAG AA and adjust text, button, and badge colors until normal text reaches 4.5:1 contrast.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(sections.accessibility, Math.max(45, sections.accessibility.score - 8));
  }

  if (visualData.mobileResponsivenessScore < 80) {
    const evidence = `Mobile visual score was ${Math.round(
      visualData.mobileResponsivenessScore
    )}/100 from horizontal-scroll and touch-target checks.`;

    addFindingOnce(sections.performance, 'Mobile layout friction detected', evidence);
    addRecommendationOnce(
      sections.performance,
      createRecommendation(
        'mobile-layout-friction',
        'Repair mobile shopping friction',
        'high',
        'Mobile layout issues make browsing, tapping, and checkout slower for the traffic most likely to abandon.',
        'Remove horizontal overflow, resize small tap targets to at least 44px, and retest product cards, menus, cart drawers, and checkout CTAs at 320-390px widths.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(sections.performance, Math.max(40, visualData.mobileResponsivenessScore));
  }
}

function enrichSectionsWithAISignals(
  sections: AnalysisResult['sections'],
  aiData: NonNullable<AnalysisResult['aiAnalysis']>,
  scanScope: ScanScope
) {
  const seo = sections.seo;

  if (aiData.structuredDataTypes.length === 0) {
    const evidence = 'No JSON-LD structured data types were detected in the analyzed HTML.';
    addFindingOnce(seo, 'AI-readable structured data missing', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-structured-data',
        'Add AI-readable structured data',
        'high',
        'AI answer engines, search rich results, and shopping surfaces need structured facts to understand products, organization details, breadcrumbs, and FAQs.',
        'Add valid JSON-LD for Product, Organization, BreadcrumbList, WebSite, and FAQPage where relevant, then validate it with Rich Results and schema validators.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(seo, Math.max(55, seo.score - 8));
  } else if (
    scanScope.productPagesScanned &&
    ['missing', 'partial', 'invalid'].includes(scanScope.productSchemaCoverageStatus)
  ) {
    const sampledUrls = scanScope.productSchemaEvidence?.map(item => item.url) ?? [];
    const fieldMatrix = scanScope.productSchemaEvidence
      ?.map(item => {
        const fields = Object.entries(item.fields)
          .map(([field, present]) => `${field}:${present ? 'yes' : 'no'}`)
          .join(', ');
        const formats = item.markupFormats?.length ? item.markupFormats.join('/') : 'none';
        return `${item.url} (${formats}) ${fields}`;
      })
      .join(' | ');
    const evidence =
      scanScope.productSchemaCoverageStatus === 'missing'
        ? `Product JSON-LD was not found in the source HTML of ${scanScope.productPageCountSucceeded} confirmed sampled product pages. Sampled URLs: ${sampledUrls.join(', ')}. Field matrix: ${fieldMatrix || 'not available'}.`
        : `Product structured-data coverage on confirmed sampled product pages: ${scanScope.productSchemaCoverageStatus}. Sampled URLs: ${sampledUrls.join(', ')}. Field matrix: ${fieldMatrix || 'not available'}.`;
    addFindingOnce(seo, 'Product schema could not be fully verified', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-product-schema',
        scanScope.productSchemaCoverageStatus === 'missing'
          ? 'Add Product schema to sellable pages'
          : 'Fix Product schema on sampled product pages',
        scanScope.productSchemaCoverageStatus === 'missing' ? 'high' : 'medium',
        'Product schema helps search, shopping, and AI answer surfaces understand price, availability, reviews, images, and product identity.',
        'Add Product JSON-LD to confirmed product detail templates with name, image, description, SKU, offers, availability, priceCurrency, price, and aggregateRating when reviews exist.',
        evidence,
        'medium',
        'product_sample',
        'verified',
        sampledUrls
      )
    );
    lowerSectionScore(seo, Math.max(60, seo.score - 6));
  } else if (scanScope.productSchemaCoverageStatus === 'not_verified') {
    const evidence =
      scanScope.notes?.[1] ||
      'Product schema coverage is not verified because fewer than the requested product-page samples could be confirmed.';
    if (!seo.findings.some(finding => finding.title === 'Product schema not verified')) {
      seo.findings.push({
        type: 'issue',
        title: 'Product schema not verified',
        description: evidence,
        source: 'product_sample',
        confidence: 'insufficient_evidence',
        scannedUrlScope: scanScope.scannedUrls,
        exactEvidence: [evidence, ...(scanScope.productSchemaEvidence?.map(item => item.url) ?? [])],
        limitation: 'Confirmed product-page sample count was below the requested sample size.',
      });
    }
  } else if (!scanScope.productPagesScanned) {
    const evidence = 'Product pages were not scanned, so product schema coverage could not be verified.';
    if (!seo.findings.some(finding => finding.title === 'Product schema not verified')) {
      seo.findings.push({
        type: 'issue',
        title: 'Product schema not verified',
        description: evidence,
        source: 'static_html',
        confidence: 'insufficient_evidence',
        scannedUrlScope: scanScope.scannedUrls,
        exactEvidence: [evidence],
        limitation: 'No product-page HTML was fetched for this run.',
      });
    }
  }

  if (!aiData.openGraphTags) {
    const evidence = 'No Open Graph or Twitter card metadata was detected.';
    addFindingOnce(seo, 'Social and AI preview metadata missing', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-social-metadata',
        'Add share and preview metadata',
        'medium',
        'Open Graph and Twitter card metadata improve how products and collections are summarized when shared, crawled, or cited by assistant-style surfaces.',
        'Add og:title, og:description, og:image, og:url, twitter:card, and product-specific preview metadata to key storefront templates.',
        evidence,
        'quick'
      )
    );
    lowerSectionScore(seo, Math.max(65, seo.score - 4));
  }

  if (aiData.readabilityScore < 60) {
    const evidence = `AI readability score was ${aiData.readabilityScore}/100 from heading, paragraph, list, and FAQ-style content signals.`;
    addFindingOnce(seo, 'Store content is hard for AI systems to summarize', evidence);
    addRecommendationOnce(
      seo,
      createRecommendation(
        'ai-content-clarity',
        'Make pages easier for AI to summarize',
        'medium',
        'Thin or poorly structured content gives search engines and AI answer systems fewer reliable facts to cite about your products, policies, and differentiators.',
        'Add clear H2 sections, concise product/category explanations, FAQ blocks, policy summaries, and bullet lists that answer buying questions directly.',
        evidence,
        'medium'
      )
    );
    lowerSectionScore(seo, Math.max(60, seo.score - 5));
  }
}

async function runHeavyAnalysisTasks(
  html: string,
  normalizedUrl: string,
  fetchedUrl: string,
  scanScope: ScanScope
) {
  return Promise.all([
    CompetitorService.analyzeCompetitors(html, normalizedUrl).catch(err => {
      recordAnalyzerServiceFailure('competitor', err, true);
      return {
        competitors: [],
        marketPosition: 'unknown' as const,
        confidence: 'low' as const,
        summary: 'Competitor analysis could not be completed for this URL.',
        evidence: ['Competitor service failed gracefully.'],
        source: 'static_html' as const,
        analysisConfidence: 'unavailable' as const,
        scannedUrlScope: [normalizedUrl],
      };
    }),
    ScraperService.scrape(fetchedUrl).catch(err => {
      recordAnalyzerServiceFailure('puppeteer', err, true);
      return {
        visualAnalysis: null,
        productAnalysis: undefined,
        deeperScan: unavailableDeeperScan('Browser automation failed before sampling.'),
      };
    }),
    Promise.resolve(AIReadinessService.analyze(html, scanScope)).catch(err => {
      recordAnalyzerServiceFailure('ai', err, true);
      return {
        score: 50,
        label: 'Content & structured-data readiness' as const,
        confidence: 'unavailable' as const,
        evidence: [],
        limitations: ['AI readiness analysis failed gracefully.'],
        scannedScope: scanScope,
        structuredDataTypes: [],
        openGraphTags: false,
        readabilityScore: 50,
        aiReadinessStatus: 'needs_improvement' as const,
      };
    }),
  ]);
}

// --- Main Service Class ---

export class AnalyzerService {
  static async analyzeStore(normalizedUrl: string): Promise<AnalysisResult> {
    const cacheKey = `analyze:${normalizedUrl}`;

    // 1. Check Cache
    const cached = await CacheService.get<AnalysisResult>(cacheKey);
    if (cached) {
      Logger.debug('Returning cached analysis', { url: normalizedUrl });
      const cachedScanScope = defaultScanScope(
        cached.storeUrl || normalizedUrl,
        cached.scanScope || cached.meta?.scanScope
      );
      const competitorAnalysis = suppressLegacyCompetitors(cached, cachedScanScope);
      const suppressedLegacyCompetitors =
        Boolean(cached.competitorAnalysis?.competitors?.length) &&
        !competitorAnalysis?.competitors?.length;
      return {
        ...cached,
        scanScope: cachedScanScope,
        competitorAnalysis,
        meta: {
          usedLighthouse: cached.meta?.usedLighthouse ?? true,
          usedHtmlFallback: cached.meta?.usedHtmlFallback ?? false,
          visualAnalysisAttempted: cached.meta?.visualAnalysisAttempted ?? false,
          visualAnalysisAvailable:
            cached.meta?.visualAnalysisAvailable ?? Boolean(cached.visualAnalysis),
          productAnalysisAttempted:
            cached.meta?.productAnalysisAttempted ?? Boolean(cached.deeperScan?.productPagesAttempted),
          productAnalysisAvailable:
            cached.meta?.productAnalysisAvailable ?? Boolean(cached.productAnalysis),
          deeperScanAttempted:
            cached.meta?.deeperScanAttempted ?? Boolean(cached.deeperScan?.attempted),
          deeperScanAvailable: cached.meta?.deeperScanAvailable ?? Boolean(cached.deeperScan?.available),
          competitorAnalysisAttempted: cached.meta?.competitorAnalysisAttempted ?? Boolean(cached.competitorAnalysis),
          competitorAnalysisAvailable:
            suppressedLegacyCompetitors
              ? false
              : (cached.meta?.competitorAnalysisAvailable ??
                competitorAnalysis?.analysisConfidence !== 'unavailable'),
          featureAvailability: cached.meta?.featureAvailability,
          cached: true,
          scanScope: cachedScanScope,
        },
      };
    }

    // 2. Start PageSpeed early; fetch HTML first so heavy tasks can overlap with Lighthouse
    const pageSpeedPromise = fetchPageSpeedData(normalizedUrl);
    let html = '';
    let fetchedUrl = normalizedUrl;
    let heavyTasksPromise: ReturnType<typeof runHeavyAnalysisTasks> | null = null;
    let scanScope: ScanScope = defaultScanScope(normalizedUrl);
    const visualAnalysisAttempted = ScraperService.isEnabled();

    try {
      const fetched = await safeFetchStoreHtml(normalizedUrl, 15000);
      html = fetched.html;
      fetchedUrl = fetched.finalUrl;
    } catch (fetchError: any) {
      const errorDetails = {
        message: fetchError.message,
        cause: fetchError.cause,
        code: fetchError.code,
        name: fetchError.name,
        stack: fetchError.stack,
      };

      logError('Store fetch error', fetchError, { ...errorDetails, url: normalizedUrl });

      // Enhance error message based on specific failure types
      if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
        throw new Error(
          `Connection timed out after 15 seconds. The store at ${normalizedUrl} took too long to respond.`
        );
      }

      if (fetchError.code === 'ENOTFOUND') {
        throw new Error(
          `Could not resolve hostname for ${normalizedUrl}. Please check if the URL is correct.`
        );
      }

      if (fetchError.code === 'ECONNREFUSED') {
        throw new Error(`Connection refused by ${normalizedUrl}. The server might be down.`);
      }

      throw new Error(`Could not access store URL: ${fetchError.message}`);
    }

    const platform = detectPlatform(html, fetchedUrl);
    scanScope = await buildScanScope(html, fetchedUrl, platform).catch(error => {
      recordAnalyzerServiceFailure('ai', error, true);
      return defaultScanScope(fetchedUrl);
    });
    heavyTasksPromise = runHeavyAnalysisTasks(html, normalizedUrl, fetchedUrl, scanScope);
    const pageSpeedData = await pageSpeedPromise;

    if (!pageSpeedData) {
      recordAnalyzerServiceFailure('pagespeed', new Error('PageSpeed API unavailable'), true);
    }

    let sections: AnalysisResult['sections'];
    let coreWebVitals: AnalysisResult['coreWebVitals'] = undefined;
    let usedLighthouse = false;
    let usedHtmlFallback = false;

    if (pageSpeedData?.lighthouseResult?.categories) {
      usedLighthouse = true;
      const cats = pageSpeedData.lighthouseResult.categories;
      const audits = pageSpeedData.lighthouseResult.audits || {};

      const perfScore = Math.round((cats.performance?.score || 0) * 100);
      const seoScore = Math.round((cats.seo?.score || 0) * 100);
      const a11yScore = Math.round((cats.accessibility?.score || 0) * 100);
      const bpScore = Math.round((cats['best-practices']?.score || 0) * 100);

      sections = {
        performance: {
          name: 'Performance',
          score: perfScore,
          status: getScoreStatus(perfScore),
          ...extractLighthouseFindings(audits, 'performance', normalizedUrl),
        },
        seo: {
          name: 'SEO',
          score: seoScore,
          status: getScoreStatus(seoScore),
          ...extractLighthouseFindings(audits, 'seo', normalizedUrl),
        },
        accessibility: {
          name: 'Accessibility',
          score: a11yScore,
          status: getScoreStatus(a11yScore),
          ...extractLighthouseFindings(audits, 'accessibility', normalizedUrl),
        },
        bestPractices: {
          name: 'Best Practices',
          score: bpScore,
          status: getScoreStatus(bpScore),
          ...extractLighthouseFindings(audits, 'best-practices', normalizedUrl),
        },
        cart: analyzeCartExperience(html, { platform }),
        trust: analyzeTrust(html),
      };

      const m = pageSpeedData.loadingExperience?.metrics;
      if (m) {
        coreWebVitals = {};
        if (m.LARGEST_CONTENTFUL_PAINT_MS)
          coreWebVitals.lcp = {
            value: m.LARGEST_CONTENTFUL_PAINT_MS.percentile,
            rating: m.LARGEST_CONTENTFUL_PAINT_MS.category,
          };
        if (m.CUMULATIVE_LAYOUT_SHIFT_SCORE)
          coreWebVitals.cls = {
            value: m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100,
            rating: m.CUMULATIVE_LAYOUT_SHIFT_SCORE.category,
          };
        if (m.FIRST_INPUT_DELAY_MS)
          coreWebVitals.fid = {
            value: m.FIRST_INPUT_DELAY_MS.percentile,
            rating: m.FIRST_INPUT_DELAY_MS.category,
          };
      }
    } else {
      usedHtmlFallback = true;
      Logger.warn('Using fallback analysis', { url: normalizedUrl });
      sections = {
        performance: analyzePerformanceFallback(html),
        seo: analyzeSEOFallback(html),
        accessibility: analyzeAccessibilityFallback(html),
        bestPractices: analyzeBestPracticesFallback(fetchedUrl, html),
        cart: analyzeCartExperience(html, { platform }),
        trust: analyzeTrust(html),
      };

      if (!sections.accessibility) {
        sections.accessibility = {
          name: 'Accessibility',
          score: 50,
          status: 'warning',
          findings: [],
          recommendations: [
            createRecommendation(
              'accessibility-audit',
              'Run a full accessibility audit',
              'high',
              'The fallback analyzer could not gather enough accessibility detail to verify WCAG risks.',
              'Run a browser-based accessibility audit and fix keyboard, label, alt text, and contrast failures.',
              'Full Lighthouse accessibility data was unavailable.',
              'medium'
            ),
          ],
        };
      }
    }

    const serviceStartTime = Date.now();
    const [competitorData, scraperData, aiData] = await (heavyTasksPromise ??
      runHeavyAnalysisTasks(html, normalizedUrl, fetchedUrl, scanScope));

    Logger.debug('External services completed', {
      durationMs: Date.now() - serviceStartTime,
    });

    // Destructure scraper results
    const {
      visualAnalysis: visualData,
      productAnalysis: productData,
      deeperScan: deeperScanData,
    } = scraperData;
    const featureAvailability = buildFeatureAvailability({
      usedLighthouse,
      usedHtmlFallback,
      visualAnalysisAttempted,
      visualData,
      productData,
      deeperScanData,
      competitorData,
    });
    sections.cart = analyzeCartExperience(html, {
      platform,
      productAnalysis: productData,
      deeperScan: deeperScanData,
    });
    enrichSectionsWithVisualSignals(sections, visualData || undefined);
    enrichSectionsWithAISignals(sections, aiData, scanScope);
    applyEvidenceDefaults(
      sections,
      usedLighthouse ? 'lighthouse' : 'static_html',
      usedLighthouse ? 'verified' : 'estimated',
      scanScope.scannedUrls,
      usedLighthouse
        ? undefined
        : 'Lighthouse/PageSpeed was unavailable; this item is based on static HTML heuristics.'
    );

    // 8. Calculate Overall Score
    const weights = {
      performance: 0.3,
      seo: 0.25,
      accessibility: 0.15,
      bestPractices: 0.1,
      cart: 0.1,
      trust: 0.1,
    };

    const overallScore = Math.round(
      Object.entries(sections).reduce(
        (sum, [key, section]) =>
          sum + section.score * (weights[key as keyof typeof weights] || 0.1),
        0
      )
    );

    // 9. Benchmark comparison. Only returned when there is enough stored data.
    const benchmark = await BenchmarkService.getBenchmarkComparison(overallScore, html);

    const meta: AnalysisMeta = {
      usedLighthouse,
      usedHtmlFallback,
      visualAnalysisAttempted,
      visualAnalysisAvailable: Boolean(visualData),
      productAnalysisAttempted: featureAvailability.product?.attempted,
      productAnalysisAvailable: Boolean(productData),
      deeperScanAttempted: featureAvailability.deeperScan?.attempted,
      deeperScanAvailable: Boolean(deeperScanData?.available),
      competitorAnalysisAttempted: true,
      competitorAnalysisAvailable: featureAvailability.competitors?.available ?? false,
      featureAvailability,
      cached: false,
      scanScope,
    };

    const result: AnalysisResult = {
      storeUrl: fetchedUrl,
      overallScore,
      platform,
      sections,
      coreWebVitals,
      competitorAnalysis: competitorData,
      visualAnalysis: visualData || undefined,
      aiAnalysis: aiData,
      productAnalysis: productData,
      deeperScan: deeperScanData,
      scanScope,
      percentile: benchmark?.percentile,
      benchmark,
      generatedAt: new Date().toISOString(),
      meta,
    };

    // Cache & Save Benchmark (Fire and forget-ish, using Promise.all to ensure completion before func end)
    // Both operations have individual error handling to prevent failures
    await Promise.all([
      CacheService.set(cacheKey, result, 86400).catch(err =>
        recordAnalyzerServiceFailure('cache', err, true)
      ),
      BenchmarkService.saveBenchmark(result, html).catch(err =>
        recordAnalyzerServiceFailure('benchmark', err, true)
      ),
    ]);

    return result;
  }
}
