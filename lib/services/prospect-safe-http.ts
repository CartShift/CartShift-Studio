import 'server-only';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { publicIpv4Only } from '@/lib/services/prospect-scan-engine';

const MAX_BODY_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 8_000;

export type ProspectFetchResponse = {
  finalUrl: string;
  status: number;
  contentType: string;
  body: string;
};

export function assertProspectNetworkUrl(value: string, originalHost?: string): URL {
  const url = new URL(value);
  const canonical = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash ||
      !canonical.includes('.') || /\.(?:local|internal|localhost|test|example|invalid|onion)$/.test(canonical) ||
      /^\d+(?:\.\d+){3}$/.test(canonical) || canonical.startsWith('[') ||
      (originalHost && canonical !== originalHost.toLowerCase().replace(/^www\./, ''))) {
    throw new Error('SCAN_URL_NOT_ALLOWED');
  }
  return url;
}

async function pinnedPublicIpv4(host: string): Promise<string> {
  const addresses = await lookup(host, { all: true, verbatim: true });
  const v4 = addresses.filter(record => record.family === 4);
  if (!v4.length || v4.some(record => !publicIpv4Only(record.address))) {
    throw new Error('SCAN_ADDRESS_NOT_PUBLIC');
  }
  return v4[0].address;
}

async function pinnedHttpsResponse(url: URL): Promise<ProspectFetchResponse> {
  const pinnedIp = await pinnedPublicIpv4(url.hostname);
  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (!settled) { settled = true; reject(error); }
    };
    const req = request(url, {
      method: 'GET',
      timeout: REQUEST_TIMEOUT_MS,
      // DNS is resolved and checked ONCE, then pinned for the socket.
      // This avoids a DNS check-then-connect SSRF/rebinding window.
      lookup: (_hostname, _options, callback) => callback(null, pinnedIp, 4),
      headers: {
        'User-Agent': 'CartShift-AuditBot/1.0 (+https://cart-shift.com)',
        Accept: 'text/html,text/plain;q=0.9',
        'Accept-Encoding': 'identity',
      },
    }, response => {
      const length = Number(response.headers['content-length'] || 0);
      if (length > MAX_BODY_BYTES) {
        response.destroy(new Error('SCAN_RESPONSE_TOO_LARGE'));
        return;
      }
      const chunks: Buffer[] = [];
      let total = 0;
      response.on('data', (chunk: Buffer) => {
        total += chunk.length;
        if (total > MAX_BODY_BYTES) {
          response.destroy(new Error('SCAN_RESPONSE_TOO_LARGE'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('error', fail);
      response.on('end', () => {
        if (settled) return;
        settled = true;
        resolve({
          finalUrl: url.toString(),
          status: response.statusCode || 0,
          contentType: String(response.headers['content-type'] || '').toLowerCase(),
          body: Buffer.concat(chunks).toString('utf8'),
          ...((response.headers.location && { location: response.headers.location }) as object),
        } as ProspectFetchResponse);
      });
    });
    req.on('error', fail);
    req.on('timeout', () => req.destroy(new Error('SCAN_TIMEOUT')));
    req.end();
  });
}

export async function fetchPublicProspectPage(rawUrl: string, originalHost?: string): Promise<ProspectFetchResponse> {
  let url = assertProspectNetworkUrl(rawUrl, originalHost);
  const hostname = originalHost || url.hostname;
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    const response = await pinnedHttpsResponse(url);
    const location = (response as ProspectFetchResponse & { location?: string }).location;
    if (response.status >= 300 && response.status < 400) {
      if (!location) throw new Error('SCAN_REDIRECT_WITHOUT_LOCATION');
      url = assertProspectNetworkUrl(new URL(location, url).toString(), hostname);
      continue;
    }
    if (response.status === 200 && !/^text\/(?:html|plain)/.test(response.contentType)) {
      throw new Error('SCAN_UNSUPPORTED_CONTENT_TYPE');
    }
    return { finalUrl: response.finalUrl, status: response.status,
      contentType: response.contentType, body: response.body };
  }
  throw new Error('SCAN_TOO_MANY_REDIRECTS');
}
