import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { validateLinkedInQueueItem } from './lib/linkedin-editorial-validation.mjs';

const queueFile = path.resolve('data/social/linkedin-post-queue.json');
const ledgerFile = path.resolve('data/social/linkedin-blog-post-ledger.json');
const memoryFile = path.resolve('data/social/linkedin-editorial-memory.json');
const publisherScript = path.resolve('scripts/publish-linkedin-post.mjs');

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

function sanitizePublisherOutput(output) {
  try {
    return JSON.parse(output);
  } catch {
    return {
      ok: false,
      message: output.trim() || 'Publisher returned non-JSON output.',
    };
  }
}

function updateEditorialMemory(item, linkedinPostId) {
  const memory = readJson(memoryFile, {
    version: 1,
    updatedAt: null,
    strategy: { maxRecentPosts: 32 },
    recentPosts: [],
    topicStats: {},
  });
  const maxRecentPosts = Number(memory.strategy?.maxRecentPosts) || 32;
  const publishedAt = new Date().toISOString();
  const topicKey = item.topicKey || item.slug;
  const entry = {
    slug: item.slug,
    title: item.title,
    contentType: item.contentType || 'blog',
    topicKey,
    angle: item.angle || item.title,
    audience: item.audience || 'technical-decision-makers',
    format: item.format || 'professional-perspective',
    editorialPillar: item.editorialPillar || '',
    semanticSignature: item.semanticSignature,
    critic: item.critic,
    publishedAt,
    linkedinPostId,
  };

  const recentPosts = Array.isArray(memory.recentPosts) ? memory.recentPosts : [];
  memory.recentPosts = [...recentPosts.filter(post => post.slug !== item.slug), entry].slice(
    -maxRecentPosts,
  );

  const topicStats = memory.topicStats && typeof memory.topicStats === 'object'
    ? memory.topicStats
    : {};
  const existingTopic = topicStats[topicKey] || { publishCount: 0 };
  topicStats[topicKey] = {
    publishCount: Number(existingTopic.publishCount || 0) + 1,
    lastPublishedAt: publishedAt,
    lastSlug: item.slug,
    lastAngle: entry.angle,
  };

  memory.version = 1;
  memory.updatedAt = publishedAt;
  memory.topicStats = topicStats;
  writeJsonAtomic(memoryFile, memory);
}

const queue = readJson(queueFile, { items: [] });

if (!Array.isArray(queue.items) || queue.items.length === 0) {
  console.log(JSON.stringify({ ok: true, published: false, reason: 'Queue is empty.' }, null, 2));
  process.exit(0);
}

const [item, ...remainingItems] = queue.items;
const contentType = item?.contentType || 'blog';
const validation = validateLinkedInQueueItem(item);

if (!validation.valid) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        published: false,
        slug: item?.slug,
        message: 'Queue item failed structural or editorial validation and was left queued.',
        validationErrors: validation.errors,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const publish = spawnSync(
  process.execPath,
  [
    publisherScript,
    '--text-stdin',
    '--ledger-file',
    ledgerFile,
    '--slug',
    item.slug,
    '--title',
    item.title,
    '--content-type',
    contentType,
    '--editorial-pillar',
    item.editorialPillar || '',
    '--topic-key',
    item.topicKey || item.slug,
    '--audience',
    item.audience || '',
    '--post-format',
    item.format || '',
    '--angle',
    item.angle || '',
    '--semantic-signature',
    JSON.stringify(item.semanticSignature),
    '--critic',
    JSON.stringify(item.critic),
    '--url',
    item.url || '',
    '--cycle',
    String(item.cycle || 1),
  ],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    input: item.text,
  },
);

const stdout = publish.stdout.trim();
const stderr = publish.stderr.trim();
const parsedOutput = sanitizePublisherOutput(stdout || stderr);

if (publish.status !== 0 || !parsedOutput.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        published: false,
        slug: item.slug,
        status: publish.status,
        publisher: parsedOutput,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

queue.items = remainingItems;
writeJsonAtomic(queueFile, queue);

let memoryUpdated = false;
let memoryWarning;

try {
  updateEditorialMemory(item, parsedOutput.linkedinPostId);
  memoryUpdated = true;
} catch {
  memoryWarning = 'Post published, but editorial memory could not be updated; rebuild it from the ledger.';
}

console.log(
  JSON.stringify(
    {
      ok: true,
      published: true,
      slug: item.slug,
      linkedinPostId: parsedOutput.linkedinPostId,
      ledgerUpdated: parsedOutput.ledgerUpdated,
      memoryUpdated,
      memoryWarning,
      remainingQueueItems: queue.items.length,
    },
    null,
    2,
  ),
);
