import type { Finding, Recommendation, SectionResult } from '@/lib/types/analyzer';
import { getScoreStatus } from './analyzer-platform';
import { createRecommendation } from './analyzer-recommendation';

/** Static HTML analysis when full (Puppeteer) analysis is unavailable. */
export function analyzeSEOFallback(html: string): SectionResult {
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

export function analyzePerformanceFallback(html: string): SectionResult {
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

export function analyzeAccessibilityFallback(html: string): SectionResult {
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

export function analyzeTrust(html: string): SectionResult {
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
