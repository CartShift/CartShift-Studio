import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { URL } from 'node:url';

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

function parseArgs(argv) {
  const args = {
    port: Number(process.env.LINKEDIN_OAUTH_PORT || 3457),
    scope: process.env.LINKEDIN_SCOPE || 'w_organization_social',
    writeEnv: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--scope') {
      args.scope = argv[index + 1] || args.scope;
      index += 1;
      continue;
    }

    if (arg === '--port') {
      args.port = Number(argv[index + 1] || args.port);
      index += 1;
      continue;
    }

    if (arg === '--write-env') {
      args.writeEnv = true;
    }
  }

  return args;
}

function upsertEnvValue(filePath, key, value) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const escaped = `${key}="${value}"`;
  const next = existing.match(new RegExp(`^${key}=`, 'm'))
    ? existing.replace(new RegExp(`^${key}=.*$`, 'm'), escaped)
    : `${existing}${existing.endsWith('\n') || existing.length === 0 ? '' : '\n'}${escaped}\n`;

  fs.writeFileSync(filePath, next, 'utf8');
}

loadDotEnv(path.join(process.cwd(), '.env.local'));

const args = parseArgs(process.argv.slice(2));
const clientId = process.env.LINKEDIN_CLIENT_ID;
const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
const redirectUri = `http://localhost:${args.port}/callback`;

if (!clientId || !clientSecret) {
  console.error('Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET.');
  process.exit(1);
}

const state = crypto.randomBytes(18).toString('hex');
const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');

authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('state', state);
authUrl.searchParams.set('scope', args.scope);

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', redirectUri);

  if (requestUrl.pathname !== '/callback') {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const code = requestUrl.searchParams.get('code');
  const returnedState = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (error) {
    response.writeHead(400, { 'Content-Type': 'text/plain' });
    response.end(`LinkedIn returned an error: ${errorDescription || error}`);
    console.error(JSON.stringify({ ok: false, error, errorDescription }, null, 2));
    server.close();
    return;
  }

  if (!code || returnedState !== state) {
    response.writeHead(400, { 'Content-Type': 'text/plain' });
    response.end('Invalid OAuth callback.');
    console.error(JSON.stringify({ ok: false, error: 'invalid_callback' }, null, 2));
    server.close();
    return;
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = await tokenResponse.json();

  if (!tokenResponse.ok) {
    response.writeHead(502, { 'Content-Type': 'text/plain' });
    response.end('Token exchange failed. Check the terminal output.');
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: tokenJson.error,
          errorDescription: tokenJson.error_description,
        },
        null,
        2,
      ),
    );
    server.close();
    return;
  }

  if (args.writeEnv) {
    upsertEnvValue(path.join(process.cwd(), '.env.local'), 'LINKEDIN_ACCESS_TOKEN', tokenJson.access_token);
  }

  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('LinkedIn token generated. You can close this tab and return to Codex.');

  console.log(
    JSON.stringify(
      {
        ok: true,
        scope: args.scope,
        expiresInSeconds: tokenJson.expires_in,
        wroteEnv: args.writeEnv,
        tokenPreview: `${tokenJson.access_token.slice(0, 8)}...`,
      },
      null,
      2,
    ),
  );
  server.close();
});

server.listen(args.port, () => {
  console.log(`Add this Redirect URL in the LinkedIn app first:\n${redirectUri}\n`);
  console.log(`Then open this authorization URL:\n${authUrl.toString()}\n`);
});
