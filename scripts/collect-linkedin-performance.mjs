import fs from 'node:fs';
import path from 'node:path';
import {
  PERFORMANCE_METRICS,
  readJson,
  upsertPerformancePost,
  writeJsonAtomic,
} from './lib/linkedin-performance.mjs';

const REQUIRED_SCOPE = 'r_member_postAnalytics';
const feedbackFile = path.resolve('data/social/linkedin-performance-feedback.json');
const ledgerFile = path.resolve('data/social/linkedin-blog-post-ledger.json');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...parts] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = parts.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
}

function parseArgs(argv) {
  const args = { limit: 8, minAgeHours: 24 };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--limit') args.limit = Number(argv[++index] || args.limit);
    else if (argv[index] === '--min-age-hours') args.minAgeHours = Number(argv[++index] || args.minAgeHours);
  }
  return args;
}

async function introspectScopes({ token, clientId, clientSecret }) {
  if (!clientId || !clientSecret) return [];
  const response = await fetch('https://www.linkedin.com/oauth/v2/introspectToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token, client_id: clientId, client_secret: clientSecret }),
  });
  if (!response.ok) return [];
  const body = await response.json();
  return String(body.scope || '').split(/[\s,]+/).filter(Boolean);
}

function analyticsEntity(postUrn) {
  const type = postUrn.includes(':ugcPost:') ? 'ugc' : 'share';
  return `(${type}:${encodeURIComponent(postUrn)})`;
}

async function fetchMetric({ token, version, postUrn, queryType }) {
  const url = new URL('https://api.linkedin.com/rest/memberCreatorPostAnalytics');
  url.search = `q=entity&entity=${analyticsEntity(postUrn)}&queryType=${queryType}&aggregation=TOTAL`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Linkedin-Version': version,
      'X-RestLi-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const error = new Error('LinkedIn member analytics request failed.');
    error.status = response.status;
    throw error;
  }
  const body = await response.json();
  return (body.elements || []).reduce((total, element) => total + Number(element.count || 0), 0);
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'));
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.LINKEDIN_ANALYTICS_ACCESS_TOKEN?.trim();
  const clientId = process.env.LINKEDIN_ANALYTICS_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_ANALYTICS_CLIENT_SECRET?.trim();
  const version = process.env.LINKEDIN_VERSION?.trim() || '202604';
  const feedback = readJson(feedbackFile, {
    version: 1,
    collection: {},
    posts: {},
    topicPerformance: {},
  });
  feedback.collection ||= {};
  feedback.collection.lastAttemptAt = new Date().toISOString();

  if (!token) {
    feedback.collection.scopeAvailable = false;
    feedback.collection.credentialProfile = 'analytics-only';
    feedback.collection.status = 'awaiting-analytics-access-token';
    writeJsonAtomic(feedbackFile, feedback);
    console.log(
      JSON.stringify(
        {
          ok: true,
          collected: false,
          reason: 'Analytics app is configured but has no analytics access token yet.',
        },
        null,
        2,
      ),
    );
    return;
  }

  const scopes = await introspectScopes({ token, clientId, clientSecret });
  feedback.collection.requiredScope = REQUIRED_SCOPE;
  feedback.collection.scopeAvailable = scopes.includes(REQUIRED_SCOPE);
  feedback.collection.credentialProfile = 'analytics-only';
  feedback.collection.status = feedback.collection.scopeAvailable
    ? 'authorized'
    : 'token-missing-required-scope';

  if (!feedback.collection.scopeAvailable) {
    writeJsonAtomic(feedbackFile, feedback);
    console.log(
      JSON.stringify(
        {
          ok: true,
          collected: false,
          reason: `Token does not include ${REQUIRED_SCOPE}; retained manual performance feedback.`,
        },
        null,
        2,
      ),
    );
    return;
  }

  const ledger = readJson(ledgerFile, { posted: [] });
  const cutoff = Date.now() - args.minAgeHours * 60 * 60 * 1000;
  const candidates = (ledger.posted || [])
    .filter(entry => entry.linkedinPostId && new Date(entry.postedAt).getTime() <= cutoff)
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    .slice(0, Math.max(1, args.limit));
  let collected = 0;

  try {
    for (const entry of candidates) {
      const metrics = {};
      for (const [queryType, key] of Object.entries(PERFORMANCE_METRICS)) {
        metrics[key] = await fetchMetric({ token, version, postUrn: entry.linkedinPostId, queryType });
      }
      upsertPerformancePost(feedback, entry, metrics, 'linkedin-api');
      collected += 1;
    }
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          collected: false,
          status: error.status,
          message: 'LinkedIn analytics collection failed; existing feedback was preserved.',
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
    return;
  }

  feedback.collection.lastSuccessfulCollectionAt = new Date().toISOString();
  writeJsonAtomic(feedbackFile, feedback);
  console.log(JSON.stringify({ ok: true, collected: true, postsUpdated: collected }, null, 2));
}

await main();
