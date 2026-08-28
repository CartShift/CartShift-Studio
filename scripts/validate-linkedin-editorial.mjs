import fs from 'node:fs';
import path from 'node:path';
import { validateLinkedInQueueItem } from './lib/linkedin-editorial-validation.mjs';

const queueFile = path.resolve('data/social/linkedin-post-queue.json');
const memoryFile = path.resolve('data/social/linkedin-editorial-memory.json');

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const queue = readJson(queueFile, { items: [] });
const memory = readJson(memoryFile, { recentPosts: [] });
const recentPosts = Array.isArray(memory.recentPosts) ? memory.recentPosts.slice(-6) : [];
const items = Array.isArray(queue.items) ? queue.items : [];
const results = items.map(item => ({
  slug: item?.slug || '',
  ...validateLinkedInQueueItem(item, { recentPosts }),
}));
const valid = Array.isArray(queue.items) && results.every(result => result.valid);

console.log(
  JSON.stringify(
    {
      ok: valid,
      queueSize: items.length,
      results,
    },
    null,
    2
  )
);

if (!valid) process.exitCode = 1;
