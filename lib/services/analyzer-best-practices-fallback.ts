import type { Finding, Recommendation, SectionResult } from '@/lib/types/analyzer';

function getScoreStatus(score: number): SectionResult['status'] {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

function createRecommendation(
  code: string,
  title: string,
  impact: Recommendation['impact'],
  description: string,
  action: string,
  evidence: string,
  effort: Recommendation['effort'] = impact === 'high' ? 'medium' : 'quick'
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
  };
}

export function analyzeBestPracticesFallback(fetchedUrl: string, html = ''): SectionResult {
  const findings: Finding[] = [];
  const recommendations: Recommendation[] = [];
  let score = 40;

  const isHttps = fetchedUrl.startsWith('https://');
  if (isHttps) {
    score += 35;
    findings.push({
      type: 'positive',
      title: 'HTTPS enabled',
      description: 'The store is served over a secure connection.',
    });
  } else {
    findings.push({
      type: 'issue',
      title: 'HTTPS not detected',
      description: 'The analyzed URL is not using HTTPS.',
    });
    recommendations.push(
      createRecommendation(
        'is-on-https',
        'Enable HTTPS across the storefront',
        'high',
        'Browsers and search engines prioritize secure connections, and shoppers expect HTTPS before checkout.',
        'Force HTTPS on the custom domain and redirect all HTTP traffic to HTTPS.',
        `Final URL was ${fetchedUrl}.`,
        'medium'
      )
    );
  }

  const mixedContentMatches = isHttps
    ? html.match(/\b(?:src|href)=["']http:\/\/[^"']+["']/gi) || []
    : [];
  if (mixedContentMatches.length > 0) {
    score -= 20;
    findings.push({
      type: 'issue',
      title: 'Mixed content detected',
      description: `${mixedContentMatches.length} insecure asset or link reference${
        mixedContentMatches.length === 1 ? '' : 's'
      } found on an HTTPS page.`,
    });
    recommendations.push(
      createRecommendation(
        'mixed-content',
        'Remove mixed content from secure pages',
        'high',
        'HTTP assets on an HTTPS storefront can be blocked by browsers, break product media, and weaken shopper trust.',
        'Replace every http:// asset, stylesheet, script, image, and canonical storefront link with HTTPS or protocol-relative URLs from trusted hosts.',
        `${mixedContentMatches.length} http:// asset/link reference${
          mixedContentMatches.length === 1 ? '' : 's'
        } detected in fallback HTML.`,
        'quick'
      )
    );
  } else if (html && isHttps) {
    findings.push({
      type: 'positive',
      title: 'No mixed content detected',
      description: 'Fallback HTML did not include insecure asset or link references.',
    });
  }

  const insecureFormMatches = html.match(/<form\b[^>]*action=["']http:\/\/[^"']+["'][^>]*>/gi) || [];
  if (insecureFormMatches.length > 0) {
    score -= 25;
    findings.push({
      type: 'issue',
      title: 'Insecure form action detected',
      description: `${insecureFormMatches.length} form action posts to an insecure HTTP URL.`,
    });
    recommendations.push(
      createRecommendation(
        'insecure-form-action',
        'Secure every form submission',
        'high',
        'Forms that submit to HTTP can expose emails, account details, or checkout handoff data in transit.',
        'Move newsletter, account, cart, and checkout form actions to HTTPS endpoints and verify redirects never downgrade to HTTP.',
        `${insecureFormMatches.length} insecure form action${
          insecureFormMatches.length === 1 ? '' : 's'
        } detected in fallback HTML.`,
        'medium'
      )
    );
  }

  const normalizedScore = Math.min(100, Math.max(0, score));

  return {
    name: 'Best Practices',
    score: normalizedScore,
    status: getScoreStatus(normalizedScore),
    findings,
    recommendations,
  };
}
