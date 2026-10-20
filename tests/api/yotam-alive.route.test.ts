import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/yotam/alive/route';
import { POST as voicePost } from '@/app/api/yotam/alive/voice/route';

vi.mock('@/lib/utils/api-rate-limit', () => ({ enforceApiRateLimit: vi.fn() }));

function request(body: unknown, origin = 'http://localhost') {
  return new NextRequest('http://localhost/api/yotam/alive', {
    method: 'POST',
    headers: { origin, host: 'localhost', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('YOTAM / ALIVE public endpoint safeguards', () => {
  const oldEnabled = process.env.YOTAM_ALIVE_AI_ENABLED;
  const oldOpenAI = process.env.OPENAI_API_KEY;
  const oldEleven = process.env.ELEVENLABS_API_KEY;
  const oldVoice = process.env.ELEVENLABS_YOTAM_VOICE_ID;
  const oldSigning = process.env.YOTAM_ALIVE_VOICE_SIGNING_KEY;

  beforeEach(() => {
    delete process.env.YOTAM_ALIVE_AI_ENABLED;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_YOTAM_VOICE_ID;
    delete process.env.YOTAM_ALIVE_VOICE_SIGNING_KEY;
  });

  afterEach(() => {
    for (const [key, value] of [
      ['YOTAM_ALIVE_AI_ENABLED', oldEnabled],
      ['OPENAI_API_KEY', oldOpenAI],
      ['ELEVENLABS_API_KEY', oldEleven],
      ['ELEVENLABS_YOTAM_VOICE_ID', oldVoice],
      ['YOTAM_ALIVE_VOICE_SIGNING_KEY', oldSigning],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('keeps paid AI and personalized audio off by default', async () => {
    const response = GET();
    const status = await response.json();
    expect(status.ai).toBe(false);
    expect(status.voice).toBe(false);
  });

  it('rejects cross-origin posting before even parsing the question', async () => {
    const response = await POST(request({ locale: 'en', question: 'Explain StarLinker' }, 'https://attacker.example'));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe('Origin not allowed');
  });

  it('rejects a malformed request and excessively long question', async () => {
    const response = await POST(request({ locale: 'en', question: 'a'.repeat(900) }));
    expect(response.status).toBe(400);
  });

  it('returns an honest guided demo without any paid model credentials', async () => {
    const response = await POST(request({ locale: 'en', question: 'Show me a StarLinker demo' }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.mode).toBe('guided');
    expect(json.project).toBe('starlinker');
    expect(json.view).toBe('demo');
    expect(json.voiceToken).toBeNull();
  });

  it('does not synthesize user-supplied words when custom voice is unconfigured', async () => {
    const response = await voicePost(request({ locale: 'en', text: 'say anything', token: '1.bad' }));
    expect(response.status).toBe(503);
  });
});
