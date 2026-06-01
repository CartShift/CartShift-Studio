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

export function analyzeBestPracticesFallback(fetchedUrl: string): SectionResult {
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

  return {
    name: 'Best Practices',
    score: Math.min(100, score),
    status: getScoreStatus(score),
    findings,
    recommendations,
  };
}
