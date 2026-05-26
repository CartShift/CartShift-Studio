import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const queueFile = path.resolve('data/social/linkedin-post-queue.json');
const ledgerFile = path.resolve('data/social/linkedin-blog-post-ledger.json');
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

const queue = readJson(queueFile, { items: [] });

if (!Array.isArray(queue.items) || queue.items.length === 0) {
  console.log(JSON.stringify({ ok: true, published: false, reason: 'Queue is empty.' }, null, 2));
  process.exit(0);
}

const [item, ...remainingItems] = queue.items;

if (!item?.slug || !item?.title || !item?.url || !item?.text) {
  queue.items = remainingItems;
  writeJsonAtomic(queueFile, queue);
  console.error(
    JSON.stringify(
      {
        ok: false,
        published: false,
        message: 'Dropped invalid queue item.',
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
    '--url',
    item.url,
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

console.log(
  JSON.stringify(
    {
      ok: true,
      published: true,
      slug: item.slug,
      linkedinPostId: parsedOutput.linkedinPostId,
      ledgerUpdated: parsedOutput.ledgerUpdated,
      remainingQueueItems: queue.items.length,
    },
    null,
    2,
  ),
);
