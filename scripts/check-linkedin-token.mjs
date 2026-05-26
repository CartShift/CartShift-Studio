import fs from 'node:fs';
import path from 'node:path';

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
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

loadDotEnv(path.join(process.cwd(), '.env.local'));

const token = process.env.LINKEDIN_ACCESS_TOKEN;
const author = process.env.LINKEDIN_AUTHOR_URN;
const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

if (!token || !author) {
  console.error(JSON.stringify({ ok: false, message: 'Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN.' }, null, 2));
  process.exit(1);
}

if (!clientId || !clientSecret) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        tokenPresent: true,
        author,
        introspected: false,
        message: 'Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to introspect token scope.',
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const response = await fetch('https://www.linkedin.com/oauth/v2/introspectToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    token,
    client_id: clientId,
    client_secret: clientSecret,
  }),
});

const body = await response.json();

if (!response.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        status: response.status,
        error: body.error,
        errorDescription: body.error_description,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const scope = body.scope || '';
const authorType = author.split(':')[2] || 'unknown';
const organizationAuthorTypes = new Set(['organization', 'company']);
const memberAuthorTypes = new Set(['person', 'member']);
const requiredScope = organizationAuthorTypes.has(authorType)
  ? 'w_organization_social'
  : memberAuthorTypes.has(authorType)
    ? 'w_member_social'
    : 'unknown';
const scopes = scope.split(/[\s,]+/).filter(Boolean);

console.log(
  JSON.stringify(
    {
      ok: true,
      active: body.active,
      author,
      authorType,
      scope,
      requiredScope,
      scopeMatchesAuthor: requiredScope !== 'unknown' && scopes.includes(requiredScope),
    },
    null,
    2,
  ),
);
