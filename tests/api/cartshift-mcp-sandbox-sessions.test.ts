import desiredFixture from '../fixtures/sandbox-session-desired.json';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  rows: new Map<string, FirebaseFirestore.DocumentData>(),
  next: 0,
}));
vi.mock('@/lib/mcp/connection', () => {
  const ref = (path: string) => ({ path, get: async () => ({ data: () => mocks.rows.get(path) }) });
  const collection = (name: string) => ({
    doc: (id?: string) => ref(`${name}/${id || `audit-${++mocks.next}`}`),
  });
  return {
    AUDIT: 'audit',
    constantEquals: (a: string, b: string) => a === b,
    tokenHash: (v: string) => `hash:${v.split('').reverse().join('')}`,
    may: (grant: { scope: string[] }, scope: string) => {
      if (!grant.scope.includes(scope)) throw Error('INSUFFICIENT_SCOPE');
    },
    firestore: () => ({
      collection,
      runTransaction: async (fn: (tx: FirebaseFirestore.Transaction) => unknown) => {
        const writes: (() => void)[] = [];
        const result = await fn({
          get: async (r: { path: string }) => {
            if (writes.length) throw Error('READ_AFTER_WRITE');
            return { data: () => mocks.rows.get(r.path) };
          },
          create: (r: { path: string }, d: object) =>
            writes.push(() => {
              mocks.rows.set(r.path, { ...d });
            }),
          set: (r: { path: string }, d: object) =>
            writes.push(() => {
              mocks.rows.set(r.path, { ...mocks.rows.get(r.path), ...d });
            }),
          update: (r: { path: string }, d: object) =>
            writes.push(() => {
              mocks.rows.set(r.path, { ...mocks.rows.get(r.path), ...d });
            }),
        } as unknown as FirebaseFirestore.Transaction);
        writes.forEach(w => w());
        return result;
      },
    }),
  };
});
import {
  startSandboxSession,
  readSandboxSession,
  sendSandboxSessionInput,
  stopSandboxSession,
  syncSandboxSessions,
  redactSessionOutput,
} from '@/lib/mcp/sandbox-sessions';
import { getSandboxStatus } from '@/lib/mcp/sandbox-jobs';
import { POST } from '@/app/api/cartshift-mcp/sandbox/sessions/worker/route';
const owner = {
  uid: 'owner',
  clientId: 'client',
  scope: ['work:read', 'work:write'],
  resource: 'resource',
  expiresAt: 9e15,
};
const epoch = '11111111-1111-4111-8111-111111111111';
const nextEpoch = '22222222-2222-4222-8222-222222222222';
const sync = (session: unknown = null, workerEpoch = epoch) =>
  syncSandboxSessions({ action: 'sync', version: 3, epoch: workerEpoch, session });
const row = (id: string) => mocks.rows.get(`sandbox_auth_sessions/${id}`)!;
const snapshot = (id: string, output = '', overrides = {}) => ({
  session_id: id,
  status: 'running',
  output,
  output_start: 0,
  cursor: [...output].length,
  exit_code: null,
  reason: null,
  ack_input_id: null,
  ...overrides,
});
const start = async (provider = 'supabase') => {
  await sync();
  return startSandboxSession(owner, { provider });
};
describe('owner-only persistent sandbox authentication', () => {
  beforeEach(() => {
    mocks.rows.clear();
    vi.stubEnv('SANDBOX_OWNER_UID', 'owner');
    vi.stubEnv('SANDBOX_WORKER_TOKEN', 'a'.repeat(48));
    vi.useFakeTimers();
    vi.setSystemTime(1_800_000_000_000);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
  it('requires owner, scope, fresh sessions handshake and one active session', async () => {
    await expect(
      startSandboxSession({ ...owner, uid: 'other' }, { provider: 'github' })
    ).rejects.toThrow('SANDBOX_FORBIDDEN');
    await expect(
      startSandboxSession({ ...owner, scope: ['work:read'] }, { provider: 'github' })
    ).rejects.toThrow('INSUFFICIENT_SCOPE');
    await expect(startSandboxSession(owner, { provider: 'github' })).rejects.toThrow(
      'WORKER_UNAVAILABLE'
    );
    await start();
    await expect(startSandboxSession(owner, { provider: 'github' })).rejects.toThrow(
      'SESSION_ACTIVE'
    );
    vi.advanceTimersByTime(90_001);
    await expect(startSandboxSession(owner, { provider: 'github' })).rejects.toThrow(
      'WORKER_UNAVAILABLE'
    );
  });
  it('advertises interactive capability only for a fresh v3 sessions handshake', async () => {
    mocks.rows.set('sandbox_worker_state/primary', {
      version: 3,
      lastSeenAt: Date.now(),
      busy: false,
    });
    expect((await getSandboxStatus(owner)).capabilities).not.toContain('interactive_auth_sessions');
    await sync();
    expect((await getSandboxStatus(owner)).capabilities).toContain('interactive_auth_sessions');
    vi.advanceTimersByTime(90_001);
    mocks.rows.set('sandbox_worker_state/primary', {
      version: 3,
      lastSeenAt: Date.now(),
      busy: false,
    });
    expect((await getSandboxStatus(owner)).capabilities).not.toContain('interactive_auth_sessions');
  });
  it('preserves provider OAuth URLs and UUID parameters while masking only the submitted code', () => {
    const urls = [
      'https://supabase.com/dashboard/cli/login?session_id=12345678-abcd-4abc-8abc-123456789abc&token_name=mobile&public_key=abcdef12',
      'https://auth.firebase.tools/login?session=12345678-abcd-4abc-8abc-123456789abc&code_challenge=abcdef12',
      'https://app.northflank.com/cli/login#sessionToken=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    ];
    for (const url of urls) expect(redactSessionOutput(url)).toBe(url);
    expect(redactSessionOutput('Verification: cafe1234', 'cafe1234')).toBe(
      'Verification: ********'
    );
    for (const key of ['access_token', 'refresh_token', 'api_key', 'client_secret']) {
      const value = JSON.stringify({ nested: { [key]: 'test-sensitive-value' } });
      expect(redactSessionOutput(value)).not.toContain('test-sensitive-value');
      const escaped = value.replaceAll('"', '\\"');
      expect(redactSessionOutput(escaped)).not.toContain('test-sensitive-value');
    }
  });
  it('redacts credentials interrupted by ANSI sequences while retaining cursor spans', () => {
    const value = 'ghp_' + '\x1b[31m' + 'a'.repeat(36) + '\x1b[0m https://example.com/login';
    const result = redactSessionOutput(value);
    expect(result).not.toContain('a'.repeat(36));
    expect([...result].length).toBe([...value].length);
    expect(result).toContain('https://example.com/login');
  });
  it('produces the shared backend-to-Python Desired protocol fixture', async () => {
    const started = await start();
    const response = await sync();
    expect(response).toEqual({
      session: { ...desiredFixture.session, session_id: started.session_id },
    });
    expect(typeof response.session?.expires_at).toBe('number');
    expect(Number.isSafeInteger(response.session?.expires_at)).toBe(true);
  });
  it('validates fixed providers, workspace paths, limits and unknown fields', async () => {
    await sync();
    for (const args of [
      { provider: 'shell' },
      { provider: 'github', cwd: '/workspace/../etc' },
      { provider: 'github', ttl_seconds: 59 },
      { provider: 'github', idle_timeout_seconds: 301 },
      { provider: 'github', command: 'id' },
    ])
      await expect(startSandboxSession(owner, args)).rejects.toThrow();
    expect([...mocks.rows.keys()].filter(k => k.startsWith('audit/'))).toHaveLength(0);
  });
  it('stores only valid TTL and metadata audit; hides raw inputs and internal state', async () => {
    const s = await start();
    const response = await sendSandboxSessionInput(owner, {
      session_id: s.session_id,
      input_type: 'verification_code',
      input: 'abcdef12',
    });
    expect(JSON.stringify(response)).not.toContain('abcdef12');
    expect(row(s.session_id).purgeAt.toMillis()).toBe(s.expires_at + 3_600_000);
    expect(
      JSON.stringify([...mocks.rows.entries()].filter(([k]) => k.startsWith('audit/')))
    ).not.toContain('abcdef12');
    expect(await readSandboxSession(owner, { session_id: s.session_id })).not.toHaveProperty(
      'epoch'
    );
    await expect(
      readSandboxSession({ ...owner, uid: 'other' }, { session_id: s.session_id })
    ).rejects.toThrow('SANDBOX_FORBIDDEN');
  });
  it.each(['password', '12345678\n', 'ghp_' + 'a'.repeat(32), 'eyJabc.abc.def', 'y;id'])(
    'rejects invalid verification input %s',
    async input => {
      const s = await start();
      await expect(
        sendSandboxSessionInput(owner, {
          session_id: s.session_id,
          input_type: 'verification_code',
          input,
        })
      ).rejects.toThrow();
    }
  );
  it('allows confirmations and Firebase codes but rejects pasted codes for other providers', async () => {
    const s = await start('github');
    await expect(
      sendSandboxSessionInput(owner, {
        session_id: s.session_id,
        input_type: 'verification_code',
        input: 'abcdef12',
      })
    ).rejects.toThrow('INVALID_INPUT');
    await sendSandboxSessionInput(owner, {
      session_id: s.session_id,
      input_type: 'confirm',
      input: 'yes',
    });
    await sync(snapshot(s.session_id, '', { status: 'completed' }));
    const f = await start('firebase');
    await expect(
      sendSandboxSessionInput(owner, {
        session_id: f.session_id,
        input_type: 'verification_code',
        input: '4/ghp_' + 'a'.repeat(30),
      })
    ).rejects.toThrow();
    await expect(
      sendSandboxSessionInput(owner, {
        session_id: f.session_id,
        input_type: 'verification_code',
        input: '4/valid.code~-_123',
      })
    ).resolves.toMatchObject({ accepted: true });
  });
  it('authorizes fixed Northflank and Apps Script sessions with scoped input', async () => {
    await sync();
    const nf = await startSandboxSession(owner, { provider: 'northflank' });
    await expect(sendSandboxSessionInput(owner, {
      session_id: nf.session_id, input_type: 'verification_code', input: '4/not-for-northflank',
    })).rejects.toThrow('INVALID_INPUT');
    await sync(snapshot(nf.session_id, '', { status: 'completed' }));
    const apps = await startSandboxSession(owner, { provider: 'apps-script' });
    const valid = await sendSandboxSessionInput(owner, {
      session_id: apps.session_id, input_type: 'verification_code', input: '4/short-lived-oauth-code',
    });
    expect(valid.accepted).toBe(true);
    expect(JSON.stringify(valid)).not.toContain('short-lived-oauth-code');
  });
  it('deduplicates pending and acknowledged verification codes and erases only matching ack', async () => {
    const s = await start();
    const args = { session_id: s.session_id, input_type: 'verification_code', input: 'abcdef12' };
    const accepted = await sendSandboxSessionInput(owner, args);
    expect(await sendSandboxSessionInput(owner, args)).toEqual(accepted);
    await sync(snapshot(s.session_id, '', { ack_input_id: nextEpoch }));
    expect(row(s.session_id).pendingInput).not.toBeNull();
    await sync(snapshot(s.session_id, 'abcdef12', { ack_input_id: accepted.input_id }));
    expect(row(s.session_id).pendingInput).toBeNull();
    expect(row(s.session_id).output).not.toContain(args.input);
    expect(await sendSandboxSessionInput(owner, args)).toEqual(accepted);
    expect(row(s.session_id).pendingInput).toBeNull();
  });
  it('independently redacts tokens without changing code-point cursor positions', async () => {
    const s = await start();
    const out = '\u{1F600} ghp_' + 'a'.repeat(36) + ' https://example.com/login';
    await sync(snapshot(s.session_id, out));
    const result = await readSandboxSession(owner, { session_id: s.session_id, cursor: 2 });
    expect(result.output).not.toContain('ghp_');
    expect(result.cursor).toBe([...out].length);
    expect(result.output).toContain('https://example.com/login');
    expect([...redactSessionOutput(out)].length).toBe([...out].length);
  });
  it('rejects invalid spans, bytes, unknown protocol fields and regressing cursors', async () => {
    const s = await start();
    await expect(sync(snapshot(s.session_id, '\u{1F600}', { cursor: 2 }))).rejects.toThrow();
    await expect(sync(snapshot(s.session_id, '\u{1F600}'.repeat(6100)))).rejects.toThrow();
    await expect(
      syncSandboxSessions({ action: 'sync', version: 3, epoch, session: null, extra: true })
    ).rejects.toThrow();
    await sync(snapshot(s.session_id, 'current'));
    await sync(snapshot(s.session_id, 'old'));
    expect(row(s.session_id).output).toBe('current');
  });
  it('reports output gaps and reads do not extend idle expiration', async () => {
    const s = await start();
    await sync(snapshot(s.session_id, 'tail', { output_start: 100, cursor: 104 }));
    expect(await readSandboxSession(owner, { session_id: s.session_id })).toMatchObject({
      output: 'tail',
      output_start: 100,
      cursor: 104,
      output_truncated: true,
    });
    vi.advanceTimersByTime(180_000);
    expect(await readSandboxSession(owner, { session_id: s.session_id })).toMatchObject({
      status: 'expired',
      reason: 'idle_expired',
    });
  });
  it('enforces idle and TTL while disconnected, never extends past TTL', async () => {
    await sync();
    const s = await startSandboxSession(owner, {
      provider: 'supabase',
      ttl_seconds: 60,
      idle_timeout_seconds: 300,
    });
    vi.advanceTimersByTime(50_000);
    await sendSandboxSessionInput(owner, {
      session_id: s.session_id,
      input_type: 'confirm',
      input: 'y',
    });
    expect(row(s.session_id).idleDeadlineAt).toBe(s.expires_at);
    vi.advanceTimersByTime(10_000);
    expect(await sync()).toEqual({ session: null });
    expect(row(s.session_id).status).toBe('expired');
    expect(row(s.session_id).pendingInput).toBeNull();
  });
  it('stops an unseen pending session immediately and frees the active slot', async () => {
    const s = await start();
    await expect(stopSandboxSession(owner, { session_id: s.session_id })).resolves.toMatchObject({
      status: 'stopped',
    });
    const replacement = await startSandboxSession(owner, { provider: 'github' });
    expect(replacement.session_id).not.toBe(s.session_id);
    expect((await sync(snapshot(s.session_id))).session?.session_id).toBe(replacement.session_id);
    expect(row(s.session_id).status).toBe('stopped');
  });
  it('preserves stop requests until terminal snapshot and removes pending input', async () => {
    const s = await start();
    await sync(snapshot(s.session_id));
    await sendSandboxSessionInput(owner, {
      session_id: s.session_id,
      input_type: 'confirm',
      input: '',
    });
    await stopSandboxSession(owner, { session_id: s.session_id });
    expect((await sync(snapshot(s.session_id))).session).toMatchObject({
      status: 'stop_requested',
      pending_input: null,
    });
    expect(
      await sync(snapshot(s.session_id, '', { status: 'stopped', reason: 'stopped' }))
    ).toEqual({ session: null });
  });
  it('rejects live epoch races, expires old sessions on stale registration and rejects delayed old workers', async () => {
    const s = await start();
    await expect(sync(null, nextEpoch)).rejects.toThrow('EPOCH_CONFLICT');
    vi.advanceTimersByTime(90_001);
    expect(await sync(null, nextEpoch)).toEqual({ session: null });
    expect(row(s.session_id)).toMatchObject({
      status: 'expired',
      reason: 'worker_restarted',
      pendingInput: null,
    });
    await expect(sync()).rejects.toThrow('EPOCH_CONFLICT');
  });
  it('authenticates endpoint and caps actual stream bytes regardless of content-length', async () => {
    expect(
      (await POST(new Request('https://example.test', { method: 'POST', body: '{}' }))).status
    ).toBe(401);
    const headers = { authorization: 'Bearer ' + 'a'.repeat(48), 'content-length': '1' };
    expect(
      (
        await POST(
          new Request('https://example.test', {
            method: 'POST',
            headers,
            body: ' '.repeat(160_001),
          })
        )
      ).status
    ).toBe(413);
    expect(
      (await POST(new Request('https://example.test', { method: 'POST', headers, body: '{' })))
        .status
    ).toBe(400);
    expect(
      (
        await POST(
          new Request('https://example.test', {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'sync', version: 3, epoch, session: null }),
          })
        )
      ).status
    ).toBe(200);
  });
});
