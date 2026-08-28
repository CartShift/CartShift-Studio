import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildDraftPrompt,
  buildRewritePrompt,
  buildSkepticalReviewPrompt,
  buildTopicSelectionPrompt,
} from './lib/linkedin-editorial-prompts.mjs';

const root = process.cwd();
const policyFile = path.resolve(root, 'config/linkedin-editorial.json');
const ledgerFile = path.resolve(root, 'data/social/linkedin-blog-post-ledger.json');
const memoryFile = path.resolve(root, 'data/social/linkedin-editorial-memory.json');
const performanceFile = path.resolve(root, 'data/social/linkedin-performance-feedback.json');
const blogDirectory = path.resolve(root, 'content/blog');

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function frontmatterValue(source, key) {
  const match = source.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'));
  return match?.[1]?.trim() || '';
}

function collectBlogInventory(postedSlugs) {
  if (!fs.existsSync(blogDirectory)) return [];

  return fs
    .readdirSync(blogDirectory)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const source = fs.readFileSync(path.join(blogDirectory, file), 'utf8');
      const slug = file.replace(/\.md$/u, '');

      return {
        slug,
        title: frontmatterValue(source, 'title'),
        date: frontmatterValue(source, 'date'),
        excerpt: frontmatterValue(source, 'excerpt'),
        category: frontmatterValue(source, 'category'),
        path: `content/blog/${file}`,
        alreadyPublishedToLinkedIn: postedSlugs.has(slug),
      };
    })
    .sort((left, right) => String(right.date).localeCompare(String(left.date)));
}

function collectRepositoryEvidence(limit = 12) {
  const historyDepth = Math.max(limit * 4, 40);
  const result = spawnSync(
    'git',
    [
      'log',
      `-${historyDepth}`,
      '--date=iso-strict',
      '--pretty=format:@@@%H%x1f%ad%x1f%s',
      '--name-only',
    ],
    { cwd: root, encoding: 'utf8', windowsHide: true }
  );

  if (result.status !== 0) return [];

  const commits = [];
  let current;
  for (const rawLine of result.stdout.split(/\r?\n/gu)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('@@@')) {
      const [hash, date, summary] = line.slice(3).split('\u001f');
      current = { reference: hash, date, summary, files: [] };
      commits.push(current);
    } else if (current) {
      current.files.push(line.replaceAll('\\', '/'));
    }
  }

  const engineeringPath = /^(?:app|components|config|functions|lib|scripts|tests)\//u;

  return commits
    .map(commit => {
      const engineeringFiles = commit.files.filter(file => engineeringPath.test(file));

      return {
        reference: commit.reference,
        date: commit.date,
        summary: commit.summary,
        fileCount: engineeringFiles.length,
        files: engineeringFiles.slice(0, 20),
      };
    })
    .filter(commit => commit.fileCount > 0)
    .slice(0, limit);
}

function summarizePerformance(feedback) {
  const posts = feedback?.posts && typeof feedback.posts === 'object' ? feedback.posts : {};
  const usablePosts = Object.values(posts).filter(post => post?.metrics);

  return {
    source: feedback?.collection?.scopeAvailable ? 'linkedin-api' : 'manual-fallback',
    collectionStatus: feedback?.collection?.status || 'unknown',
    lastSuccessfulCollectionAt: feedback?.collection?.lastSuccessfulCollectionAt || null,
    postsWithEvidence: usablePosts.length,
    note:
      usablePosts.length > 0
        ? 'Use performance as one signal, never as the sole selection rule.'
        : 'No performance evidence is available; do not invent or infer metrics.',
  };
}

const policy = readJson(policyFile, null);
if (!policy || policy.version !== 2) {
  throw new Error(`LinkedIn editorial policy v2 is missing or invalid: ${policyFile}`);
}

const ledger = readJson(ledgerFile, { posted: [] });
const memory = readJson(memoryFile, { recentPosts: [] });
const performance = readJson(performanceFile, {});
const posted = Array.isArray(ledger.posted) ? ledger.posted : [];
const recentPosts = Array.isArray(memory.recentPosts)
  ? memory.recentPosts.slice(-8).map(entry => ({
      slug: entry.slug,
      title: entry.title,
      contentType: entry.contentType,
      topicKey: entry.topicKey,
      angle: entry.angle,
      audience: entry.audience,
      format: entry.format,
      editorialPillar: entry.editorialPillar,
      semanticSignature: entry.semanticSignature,
      editorialFingerprint: entry.editorialFingerprint,
      publishedAt: entry.publishedAt,
    }))
  : [];
const ledgerIds = new Set(posted.map(entry => entry.linkedinPostId).filter(Boolean));
const maxRecentPosts = Number(memory.strategy?.maxRecentPosts) || 32;
const expectedMemoryLength = Math.min(posted.length, maxRecentPosts);
const memoryAligned =
  expectedMemoryLength === (memory.recentPosts || []).length &&
  (memory.recentPosts || []).every(entry => ledgerIds.has(entry.linkedinPostId));
const context = {
  authorProfile: policy.authorProfile,
  editorialPolicy: policy,
  state: {
    ledgerEntries: posted.length,
    memoryEntries: (memory.recentPosts || []).length,
    memoryAligned,
  },
  recentPosts,
  blogInventory: collectBlogInventory(new Set(posted.map(entry => entry.slug))),
  repositoryEvidence: collectRepositoryEvidence(),
  performanceSummary: summarizePerformance(performance),
};

const placeholderCandidate = {
  placeholder: 'Replace with the winning candidate JSON from the topic-selection pass.',
};
const placeholderDraft = '{{DRAFT_TEXT}}';
const placeholderCritique = {
  placeholder: 'Replace with the skeptical review JSON.',
};
const promptContext = { ...context, contextReferenceOnly: true };

console.log(
  JSON.stringify(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      context,
      prompts: {
        topicSelection: buildTopicSelectionPrompt(promptContext),
        draftTemplate: buildDraftPrompt({
          ...promptContext,
          selectedCandidate: placeholderCandidate,
        }),
        skepticalReviewTemplate: buildSkepticalReviewPrompt({
          ...promptContext,
          selectedCandidate: placeholderCandidate,
          draft: placeholderDraft,
        }),
        rewriteTemplate: buildRewritePrompt({
          ...promptContext,
          selectedCandidate: placeholderCandidate,
          draft: placeholderDraft,
          critique: placeholderCritique,
        }),
      },
    },
    null,
    2
  )
);
