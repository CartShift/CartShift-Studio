import path from 'node:path';
import {
  readJson,
  upsertPerformancePost,
  writeJsonAtomic,
} from './lib/linkedin-performance.mjs';

const feedbackFile = path.resolve('data/social/linkedin-performance-feedback.json');
const ledgerFile = path.resolve('data/social/linkedin-blog-post-ledger.json');
const metricFlags = {
  '--impressions': 'impressions',
  '--members-reached': 'membersReached',
  '--reshares': 'reshares',
  '--reactions': 'reactions',
  '--comments': 'comments',
  '--saves': 'saves',
  '--sends': 'sends',
  '--link-clicks': 'linkClicks',
  '--followers-gained': 'followersGained',
  '--profile-views': 'profileViews',
};
const args = { slug: '', metrics: {} };

for (let index = 0; index < process.argv.slice(2).length; index += 1) {
  const argv = process.argv.slice(2);
  const flag = argv[index];
  if (flag === '--slug') args.slug = argv[++index] || '';
  else if (metricFlags[flag]) args.metrics[metricFlags[flag]] = Number(argv[++index] || 0);
}

if (!args.slug) {
  console.error(JSON.stringify({ ok: false, message: 'Missing --slug.' }, null, 2));
  process.exit(1);
}

const ledger = readJson(ledgerFile, { posted: [] });
const entry = (ledger.posted || []).find(post => post.slug === args.slug);
if (!entry) {
  console.error(JSON.stringify({ ok: false, message: 'Slug was not found in the posting ledger.' }, null, 2));
  process.exit(1);
}

const feedback = readJson(feedbackFile, { version: 1, collection: {}, posts: {}, topicPerformance: {} });
upsertPerformancePost(feedback, entry, args.metrics, 'manual');
writeJsonAtomic(feedbackFile, feedback);
console.log(
  JSON.stringify(
    {
      ok: true,
      slug: args.slug,
      source: 'manual',
      quality: feedback.posts[args.slug].quality,
    },
    null,
    2,
  ),
);
