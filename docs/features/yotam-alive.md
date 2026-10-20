# YOTAM / ALIVE — personal portfolio experience

## Scope

The new entry point sits inside the editorial V5 homepage at `/{en|he}/yotam`.
It opens a native accessible dialog with two surfaces: a text-first conversation
and a living, localized exploration of the **existing public portfolio data**.
It does not change the CartShift studio site, client portal or canonical projects.

- The workbench uses authentic, already-published project media and descriptions.
- "Under the hood" displays **documented** engineering highlights, not a made-up architecture diagram.
- A guided tour always works, even when AI services are unavailable.
- When enabled, the live guide uses OpenAI Responses with strict structured output.
  Only allowlisted local projects/views are actionable; no links, arbitrary scripts,
  database reads or admin actions are exposed to the model.
- Microphone dictation is opt-in, uses browser SpeechRecognition where supported,
  and is independent of server-side custom voice synthesis.
- Custom voice playback is optional, starts muted, and is available **only** for
  signed assistant answers, not arbitrary supplied text.

## Configuration (server-side only)

```dotenv
# Safe rollout: disabled until explicitly set to true.
YOTAM_ALIVE_AI_ENABLED=false
OPENAI_API_KEY=
# Optional; defaults to gpt-4.1-mini.
YOTAM_ALIVE_MODEL=gpt-4.1-mini

# Optional personalized synthesized voice; requires a verified voice
# owned/consented by Yotam. Never put these keys in NEXT_PUBLIC_ values.
ELEVENLABS_API_KEY=
ELEVENLABS_YOTAM_VOICE_ID=
# Random, private signing secret (at least 32 cryptographically random bytes).
YOTAM_ALIVE_VOICE_SIGNING_KEY=
```

Enable AI only after confirming Firebase Admin rate-limiting works and API quota
and alerts are in place. There is no fallback to paid AI when rate limiting fails.
If AI is disabled/unconfigured, the public API explicitly returns `mode: guided`.

Voice requests must include a 90-second HMAC token signed by the text endpoint
over the exact `(expiry, locale, reply text hash)` and are limited to 8 requests
per client IP per hour. Do not enable voice without verified ownership and
consent for the selected voice. Do not treat the voice feature as a way for visitors
to generate arbitrary statements impersonating Yotam.

## Privacy and security behavior

- No visitor account or microphone permission is required for text mode.
- Conversation turns are held in tab memory only; no app database persistence.
- OpenAI Responses requests use `store: false`.
- Voice requests are sent only when the visitor explicitly enables playback.
- Browser speech recognition may use the browser vendor's transcription service;
  its availability and data handling depend on the browser, and users need a clear
  notice before choosing dictation.
- Both POST endpoints check same-origin; the text API validates input with Zod
  and caps question length, history, output, timeouts and rate.
- The voice API verifies signed replies before accessing ElevenLabs, then
  streams audio back with no-store headers. No client API key exposure.
- Server logs should not record full conversation or voice payloads.
- Add/verify relevant public privacy notice text before enabling paid AI/voice.

## QA / release checklist

1. `pnpm exec vitest run tests/lib/yotam-alive.test.ts`
2. `pnpm exec tsc --noEmit`
3. `pnpm exec eslint "app/[locale]/(standalone)/portfolio-v5/AliveExperience.tsx" "app/api/yotam/alive/**/*.ts" lib/yotam-alive.ts`
4. Desktop/mobile: open/close/Escape/focus, project switching, guided prompts,
   Hebrew RTL, long project names, scroll position, reduced motion.
5. Verify unauthenticated AI request caps and no secret disclosure.
6. Verify missing keys show **guided**, not a deceptive AI or voice demo.
7. Opt into microphone on supported browsers; test denied/unsupported permissions.
8. Only after a verified custom voice ID exists: test consent, audio playback,
   origin rejection, modified text/token, expiry and rate limits.

No preview deployment is required to review the code. Do not declare voice
cloning operational until configured and tested with the authorized recording.
