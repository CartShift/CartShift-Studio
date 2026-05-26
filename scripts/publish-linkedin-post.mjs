import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';

const LINKEDIN_VERSION = process.env.LINKEDIN_VERSION || '202604';

const USAGE = `Usage:
  node scripts/publish-linkedin-post.mjs --text-file <path> [options]
  node scripts/publish-linkedin-post.mjs --text-stdin [options]

Options:
  --api <posts|ugc>        LinkedIn API mode (default: posts)
  --text-file <path>       Path to the LinkedIn post text
  --text-stdin             Read post text from stdin
  --ledger-file <path>     JSON ledger for idempotent publish tracking
  --slug <slug>            Required with --ledger-file
  --title <title>          Required with --ledger-file
  --url <url>              Required with --ledger-file
  --cycle <number>         Optional campaign cycle number (default: 1)
  --dry-run                Validate payload without posting
  --force                  Post even if slug already exists in the ledger
  --probe                  Test outbound access to api.linkedin.com without posting
  --help                   Show this help text

Environment:
  LINKEDIN_ACCESS_TOKEN    OAuth access token
  LINKEDIN_AUTHOR_URN      urn:li:person:{id} or urn:li:organization:{id}
`;

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {
    api: process.env.LINKEDIN_API || 'posts',
    cycle: '',
    dryRun: false,
    force: false,
    help: false,
    ledgerFile: '',
    probe: false,
    slug: '',
    textFile: '',
    textStdin: false,
    title: '',
    url: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg === '--force') {
      args.force = true;
      continue;
    }

    if (arg === '--probe') {
      args.probe = true;
      continue;
    }

    if (arg === '--api') {
      args.api = argv[index + 1] || args.api;
      index += 1;
      continue;
    }

    if (arg === '--text-stdin') {
      args.textStdin = true;
      continue;
    }

    if (arg === '--text-file') {
      args.textFile = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (arg === '--ledger-file') {
      args.ledgerFile = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (arg === '--slug') {
      args.slug = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (arg === '--title') {
      args.title = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (arg === '--url') {
      args.url = argv[index + 1] || '';
      index += 1;
      continue;
    }

    if (arg === '--cycle') {
      args.cycle = argv[index + 1] || '';
      index += 1;
    }
  }

  return args;
}

function fail(message, details = {}) {
  console.error(JSON.stringify({ ok: false, message, ...details }, null, 2));
  process.exitCode = 1;
}

function requestLinkedInPost({ token, payload }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(
      {
        hostname: 'api.linkedin.com',
        path: '/rest/posts',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Linkedin-Version': LINKEDIN_VERSION,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
      response => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', chunk => {
          responseBody += chunk;
        });
        response.on('end', () => {
          resolve({
            body: responseBody,
            linkedinPostId: response.headers['x-restli-id'] || '',
            statusCode: response.statusCode ?? 0,
          });
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function requestLinkedInUgcPost({ token, payload }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(
      {
        hostname: 'api.linkedin.com',
        path: '/v2/ugcPosts',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
      response => {
        let responseBody = '';

        response.setEncoding('utf8');
        response.on('data', chunk => {
          responseBody += chunk;
        });
        response.on('end', () => {
          resolve({
            body: responseBody,
            linkedinPostId: response.headers['x-restli-id'] || '',
            statusCode: response.statusCode ?? 0,
          });
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function probeLinkedInApi() {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: 'api.linkedin.com',
        path: '/',
        method: 'HEAD',
        timeout: 10000,
      },
      response => {
        response.resume();
        response.on('end', () => {
          resolve({ statusCode: response.statusCode ?? 0 });
        });
      },
    );

    request.on('timeout', () => {
      request.destroy(new Error('LinkedIn API probe timed out.'));
    });
    request.on('error', reject);
    request.end();
  });
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      input += chunk;
    });
    process.stdin.on('end', () => {
      resolve(input);
    });
    process.stdin.on('error', reject);
  });
}

function readLedger(ledgerFile) {
  if (!fs.existsSync(ledgerFile)) {
    return { posted: [] };
  }

  const ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));

  if (!Array.isArray(ledger.posted)) {
    return { posted: [] };
  }

  return ledger;
}

function findLedgerEntry(ledger, slug) {
  return ledger.posted.find(entry => entry.slug === slug);
}

function writeLedgerAtomic(ledgerFile, ledger) {
  const ledgerDir = path.dirname(ledgerFile);
  fs.mkdirSync(ledgerDir, { recursive: true });

  const tempFile = `${ledgerFile}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  fs.renameSync(tempFile, ledgerFile);
}

function updateLedger({ args, commentary, linkedinPostId }) {
  if (!args.ledgerFile) {
    return false;
  }

  if (!args.slug || !args.title || !args.url) {
    throw new Error('Ledger updates require --slug, --title, and --url.');
  }

  const ledgerFile = path.resolve(args.ledgerFile);
  const ledger = readLedger(ledgerFile);
  const cycle = Number.parseInt(args.cycle || '1', 10);

  ledger.posted.push({
    slug: args.slug,
    title: args.title,
    url: args.url,
    postedAt: new Date().toISOString(),
    linkedinPostId,
    cycle: Number.isNaN(cycle) ? 1 : cycle,
    commentaryCharacters: commentary.length,
    textSource: args.textStdin ? 'stdin' : path.resolve(args.textFile),
  });

  writeLedgerAtomic(ledgerFile, ledger);
  return true;
}

function assertLedgerReadyForPublish(args) {
  if (!args.ledgerFile || !args.slug) {
    return null;
  }

  const ledgerFile = path.resolve(args.ledgerFile);
  const existing = findLedgerEntry(readLedger(ledgerFile), args.slug);

  if (existing && !args.force) {
    fail('Slug already exists in ledger. Use --force to publish again.', {
      slug: args.slug,
      linkedinPostId: existing.linkedinPostId,
      postedAt: existing.postedAt,
    });
    return existing;
  }

  return null;
}

loadDotEnv(path.join(process.cwd(), '.env.local'));

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(USAGE);
  process.exit(0);
}

const token = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
const author = process.env.LINKEDIN_AUTHOR_URN?.trim();

if (args.probe) {
  try {
    const result = await probeLinkedInApi();

    console.log(
      JSON.stringify(
        {
          ok: true,
          probe: true,
          host: 'api.linkedin.com',
          statusCode: result.statusCode,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    fail('LinkedIn API probe failed before publishing.', {
      code: error.code,
      message: error.message,
    });
  }
} else if (!token) {
  fail('Missing LINKEDIN_ACCESS_TOKEN.');
} else if (!author) {
  fail('Missing LINKEDIN_AUTHOR_URN.');
} else if (!/^urn:li:(person|organization|member|company):[A-Za-z0-9_-]+$/.test(author)) {
  fail(
    'LINKEDIN_AUTHOR_URN must look like urn:li:person:{id}, urn:li:organization:{id}, urn:li:member:{id}, or urn:li:company:{id}.',
  );
} else if (args.api === 'ugc' && !/^urn:li:(member|company):/.test(author)) {
  fail('UGC API mode requires LINKEDIN_AUTHOR_URN to be a legacy member or company URN.');
} else if (!['posts', 'ugc'].includes(args.api)) {
  fail('Unsupported --api value. Use posts or ugc.');
} else if (!args.textFile && !args.textStdin) {
  fail('Missing --text-file path or --text-stdin.');
} else if (args.textFile && !fs.existsSync(args.textFile)) {
  fail('Text file does not exist.', { textFile: args.textFile });
} else if (assertLedgerReadyForPublish(args)) {
  // fail() already handled exit code
} else {
  const commentary = (
    args.textStdin ? await readStdin() : fs.readFileSync(args.textFile, 'utf8')
  ).trim();

  if (!commentary) {
    fail('LinkedIn post text is empty.');
  } else {
    const postsPayload = {
      author,
      commentary,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    };

    const ugcPayload = {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: commentary,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    if (args.dryRun) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            dryRun: true,
            author,
            api: args.api,
            linkedinVersion: LINKEDIN_VERSION,
            commentaryCharacters: commentary.length,
            slug: args.slug || undefined,
            ledgerFile: args.ledgerFile ? path.resolve(args.ledgerFile) : undefined,
          },
          null,
          2,
        ),
      );
    } else {
      try {
        const result =
          args.api === 'ugc'
            ? await requestLinkedInUgcPost({ token, payload: ugcPayload })
            : await requestLinkedInPost({ token, payload: postsPayload });

        if (result.statusCode < 200 || result.statusCode >= 300) {
          fail('LinkedIn post creation failed.', {
            statusCode: result.statusCode,
            responseBody: result.body,
          });
        } else {
          const ledgerUpdated = updateLedger({
            args,
            commentary,
            linkedinPostId: result.linkedinPostId,
          });

          console.log(
            JSON.stringify(
              {
                ok: true,
                statusCode: result.statusCode,
                linkedinPostId: result.linkedinPostId,
                ledgerUpdated,
              },
              null,
              2,
            ),
          );
        }
      } catch (error) {
        fail('LinkedIn post creation request failed.', {
          code: error.code,
          message: error.message,
        });
      }
    }
  }
}
