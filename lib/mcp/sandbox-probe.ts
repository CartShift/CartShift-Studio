import 'server-only';

/**
 * Read-only experiment: verifies that a tool invoked through the existing
 * CartShift MCP can reach the standalone cloud probe. This does NOT reach a
 * local computer, Docker, or any customer data.
 *
 * The URL is fixed deliberately: callers cannot supply arbitrary hosts.
 */
const HEALTH_URL = 'https://ai-docker-mobile-probe.vercel.app/api/health';

type ProbeHealth = {
  ok: true;
  service: 'ai-docker-mobile-probe';
  stage: 'cloud-only';
  dockerConnected: false;
};

export async function sandboxPing(): Promise<{
  reachable: boolean;
  mode: 'cloud-only';
  dockerConnected: false;
  upstreamResponse?: ProbeHealth;
  error?: 'upstream_http_error' | 'unexpected_upstream_response' | 'network_or_timeout';
  httpStatus?: number;
}> {
  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { reachable: false, mode: 'cloud-only', dockerConnected: false,
        error: 'upstream_http_error', httpStatus: response.status };
    }

    if (!(response.headers.get('content-type') || '').includes('application/json')) {
      return { reachable: false, mode: 'cloud-only', dockerConnected: false,
        error: 'unexpected_upstream_response' };
    }

    // Limit response size; never pass through arbitrary remote content.
    const body = await response.text();
    if (body.length > 2048) {
      return { reachable: false, mode: 'cloud-only', dockerConnected: false,
        error: 'unexpected_upstream_response' };
    }

    const result: unknown = JSON.parse(body);
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      return { reachable: false, mode: 'cloud-only', dockerConnected: false,
        error: 'unexpected_upstream_response' };
    }
    const data = result as Record<string, unknown>;
    if (data.ok !== true || data.service !== 'ai-docker-mobile-probe' ||
        data.stage !== 'cloud-only' || data.dockerConnected !== false) {
      return { reachable: false, mode: 'cloud-only', dockerConnected: false,
        error: 'unexpected_upstream_response' };
    }

    const upstreamResponse: ProbeHealth = {
      ok: true, service: 'ai-docker-mobile-probe',
      stage: 'cloud-only', dockerConnected: false,
    };
    return { reachable: true, mode: 'cloud-only', dockerConnected: false, upstreamResponse };
  } catch {
    return { reachable: false, mode: 'cloud-only', dockerConnected: false,
      error: 'network_or_timeout' };
  }
}
