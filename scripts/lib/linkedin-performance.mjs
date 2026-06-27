import fs from 'node:fs';
import path from 'node:path';

export const PERFORMANCE_METRICS = {
  IMPRESSION: 'impressions',
  MEMBERS_REACHED: 'membersReached',
  RESHARE: 'reshares',
  REACTION: 'reactions',
  COMMENT: 'comments',
  POST_SAVE: 'saves',
  POST_SEND: 'sends',
  LINK_CLICKS: 'linkClicks',
  FOLLOWER_GAINED_FROM_CONTENT: 'followersGained',
  PROFILE_VIEW_FROM_CONTENT: 'profileViews',
};

export function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJsonAtomic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, filePath);
}

export function normalizeMetrics(metrics = {}) {
  return Object.fromEntries(
    Object.values(PERFORMANCE_METRICS).map(key => {
      const value = Number(metrics[key] || 0);
      return [key, Number.isFinite(value) && value >= 0 ? value : 0];
    }),
  );
}

export function calculatePerformanceQuality(rawMetrics) {
  const metrics = normalizeMetrics(rawMetrics);
  const exposure = Math.max(metrics.impressions, metrics.membersReached, 1);
  const visibleActions =
    metrics.reactions +
    metrics.comments +
    metrics.reshares +
    metrics.saves +
    metrics.sends +
    metrics.linkClicks;
  const deepProfessionalActions =
    metrics.followersGained * 8 +
    metrics.profileViews * 6 +
    metrics.saves * 5 +
    metrics.sends * 5 +
    metrics.linkClicks * 3 +
    metrics.comments * 2.5 +
    metrics.reshares * 2 +
    metrics.reactions * 0.5;
  const confidence = Math.min(1, exposure / 500);
  const qualityPerThousand = (deepProfessionalActions / exposure) * 1000;

  return {
    exposure,
    engagementRate: Number(((visibleActions / exposure) * 100).toFixed(3)),
    deepActionRate: Number(
      (
        ((metrics.followersGained +
          metrics.profileViews +
          metrics.saves +
          metrics.sends +
          metrics.linkClicks) /
          exposure) *
        100
      ).toFixed(3),
    ),
    qualityPerThousand: Number(qualityPerThousand.toFixed(2)),
    confidence: Number(confidence.toFixed(3)),
    qualityScore: Number(Math.min(100, qualityPerThousand * confidence).toFixed(2)),
  };
}

export function rebuildPerformanceAggregates(feedback) {
  const groups = {};

  for (const post of Object.values(feedback.posts || {})) {
    const topicKey = post.topicKey || post.slug;
    const group = groups[topicKey] || {
      sampleSize: 0,
      totalImpressions: 0,
      totalDeepActions: 0,
      qualityScoreSum: 0,
      lastCollectedAt: null,
    };
    const metrics = normalizeMetrics(post.metrics);
    group.sampleSize += 1;
    group.totalImpressions += metrics.impressions;
    group.totalDeepActions +=
      metrics.followersGained +
      metrics.profileViews +
      metrics.saves +
      metrics.sends +
      metrics.linkClicks;
    group.qualityScoreSum += Number(post.quality?.qualityScore || 0);
    group.lastCollectedAt = !group.lastCollectedAt || post.collectedAt > group.lastCollectedAt
      ? post.collectedAt
      : group.lastCollectedAt;
    groups[topicKey] = group;
  }

  feedback.topicPerformance = Object.fromEntries(
    Object.entries(groups).map(([topicKey, group]) => [
      topicKey,
      {
        sampleSize: group.sampleSize,
        totalImpressions: group.totalImpressions,
        totalDeepActions: group.totalDeepActions,
        averageQualityScore: Number((group.qualityScoreSum / group.sampleSize).toFixed(2)),
        lastCollectedAt: group.lastCollectedAt,
      },
    ]),
  );

  return feedback;
}

export function upsertPerformancePost(feedback, ledgerEntry, metrics, source) {
  const collectedAt = new Date().toISOString();
  const normalizedMetrics = normalizeMetrics(metrics);
  feedback.posts ||= {};
  feedback.posts[ledgerEntry.slug] = {
    slug: ledgerEntry.slug,
    linkedinPostId: ledgerEntry.linkedinPostId,
    title: ledgerEntry.title,
    topicKey: ledgerEntry.topicKey || ledgerEntry.slug,
    editorialPillar: ledgerEntry.editorialPillar || 'unknown',
    contentType: ledgerEntry.contentType || 'blog',
    publishedAt: ledgerEntry.postedAt,
    collectedAt,
    source,
    metrics: normalizedMetrics,
    quality: calculatePerformanceQuality(normalizedMetrics),
  };
  feedback.updatedAt = collectedAt;
  rebuildPerformanceAggregates(feedback);
  return feedback;
}
