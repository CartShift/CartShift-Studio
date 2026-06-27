import fs from 'node:fs';
import path from 'node:path';

const ledgerFile = path.resolve('data/social/linkedin-blog-post-ledger.json');
const memoryFile = path.resolve('data/social/linkedin-editorial-memory.json');

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonAtomic(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, filePath);
}

function legacySemanticSignature(entry) {
  if (entry.semanticSignature) {
    return entry.semanticSignature;
  }

  const articleFile = path.resolve('content/blog', `${entry.slug}.md`);
  const article = fs.existsSync(articleFile) ? fs.readFileSync(articleFile, 'utf8') : '';
  const excerpt = article.match(/^excerpt:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim();
  const category = article.match(/^category:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim();
  const concepts = [category, ...entry.slug.split('-')]
    .filter(Boolean)
    .map(value => value.toLowerCase())
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 6);

  return {
    thesis: entry.title || entry.slug,
    concepts: concepts.length >= 2 ? concepts : [entry.slug, 'legacy-post'],
    mechanism: excerpt || entry.title || entry.slug,
    consequence: excerpt || entry.title || entry.slug,
    hookPattern: 'legacy-unknown',
    confidence: 'legacy-derived',
  };
}

const ledger = readJson(ledgerFile, { posted: [] });
const memory = readJson(memoryFile, {
  version: 1,
  strategy: { maxRecentPosts: 32 },
  topicTaxonomy: {},
});
const posted = Array.isArray(ledger.posted) ? ledger.posted : [];
const maxRecentPosts = Number(memory.strategy?.maxRecentPosts) || 32;
const normalizedHistory = posted
  .filter(entry => entry?.slug && entry?.postedAt)
  .sort((a, b) => new Date(a.postedAt) - new Date(b.postedAt))
  .map(entry => ({
    slug: entry.slug,
    title: entry.title || entry.slug,
    contentType: entry.contentType || 'blog',
    topicKey: entry.topicKey || entry.slug,
    angle: entry.angle || entry.title || entry.slug,
    audience: entry.audience || 'ecommerce-decision-makers',
    format: entry.format || 'unknown',
    editorialPillar: entry.editorialPillar || 'unknown',
    semanticSignature: legacySemanticSignature(entry),
    critic: entry.critic,
    publishedAt: entry.postedAt,
    linkedinPostId: entry.linkedinPostId || '',
  }));
const topicStats = {};

for (const entry of normalizedHistory) {
  const existing = topicStats[entry.topicKey] || { publishCount: 0 };
  topicStats[entry.topicKey] = {
    publishCount: existing.publishCount + 1,
    lastPublishedAt: entry.publishedAt,
    lastSlug: entry.slug,
    lastAngle: entry.angle,
  };
}

memory.version = 1;
memory.updatedAt = new Date().toISOString();
memory.recentPosts = normalizedHistory.slice(-maxRecentPosts);
memory.topicStats = topicStats;
writeJsonAtomic(memoryFile, memory);

console.log(
  JSON.stringify(
    {
      ok: true,
      historyEntries: memory.recentPosts.length,
      topicCount: Object.keys(topicStats).length,
      memoryFile,
    },
    null,
    2,
  ),
);
