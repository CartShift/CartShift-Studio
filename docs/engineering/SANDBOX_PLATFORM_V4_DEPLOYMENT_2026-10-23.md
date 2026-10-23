# Sandbox V4 workstation deployment record — 2026-10-23

## Current stage

PR122 remains unmerged. Source/security fixes and Windows checks pass for compatible backend staging. Current main c4d39db3 was integrated, preserving Northflank and Apps Script support. Full credential-isolation cutover is gated on an independently recoverable off-laptop backup. No original container, volume, authentication home or working controller has been deleted or replaced by an isolated candidate.

## Verified baseline and backups

- Original container ai-dev-workspace, hostname ai-docker-sandbox, UID1000, read-only root, no privilege/capabilities/ports, three original named volumes, unless-stopped restart policy.
- Original owner logon supervisor is Running, Limited/Interactive, IgnoreNew, unlimited runtime, StartWhenAvailable, battery-safe; Docker Desktop autostart is configured. No physical Windows reboot performed.
- Native ARM64 age1.3.2 downloaded from its official release; archive SHA256 fae351336c8d5f30f93cc3ccdec16d1ed7851d68cdd6656d41955cc31a447c9d checked before execution.
- Encrypted original-volume snapshot: sandbox-20261023-143051-e3e0732c.tar.gz.age, 2995299959 bytes, owner-private LocalAppData/CartShiftSandbox/Backups. Authentic decryption/tar validation passed.
- Encrypted owner configuration/task snapshot: owner-configuration-20261023-143451.tar.gz.age, 964638840 bytes. Authentic decryption/tar validation passed. Original scheduled-task XML preserved in owner docs.
- Staging restore: ai-dev-sandbox-restore-8b5987e701884c608062f99c7eddfafb. All three volume roots and README present. All seven provider homes (apps-script, firebase, github, northflank, shopify, supabase, vercel) restored UID1000/mode0700. No credential contents printed or provider refresh attempted from duplicate copies.
- Initial staging init failed because the image defaulted to UID1000; corrected fixed empty-volume CHOWN helper to explicit UID0, then extracted as UID1000. Failed empty staging resource retained; live data untouched.

## Implementation corrections

Lease-bound cancellation/status, authenticated auth-channel provenance, independent channel freshness, tagged completion compatibility, full binary artifact round trip, PTY partial/EAGAIN input buffering and concurrent IPC serialization. New owner controls pin Docker executable/endpoint/image/mounts; reject escaping snapshot links; use fresh build homes; preserve original custom network; run source-pinned supervisors with dedicated-container cleanup on every exit. Credential deletion disabled.

Encrypted streaming backup covers all required volumes without plaintext staging/host bind mounts. Maintenance nonces block new jobs/logins before pause; expiry watchdog and owner-private state prevent indefinite pause or certification after expiry. Scheduling verifies each archive and retains all copies. A fixed V4 local-MCP launcher is staged; the existing three-volume launcher is unchanged.

## Tests already run

- 140 MCP tests passed across14 files, including full12000-byte binary completion/result/base64/hash round trip and mixed/stale lease regressions.
- 80 Python checks after integrating current main, one optional real-provider login test skipped (79 passed). Includes four snapshot and ten nonce/ACL fixture tests.
- Production tsconfig.build.json typecheck passed after standard translation generation; generated translation files restored byte-for-byte. Broad developer typecheck still needs existing functions email dependencies; no sandbox production TS error remains.
- Windows parsing, fixed native stdin/argv forwarding, mount/privilege refusal, normal Windows paths and mocked WhatIf checks passed.
- Real managed dev container ai-dev-v4-managed-proof served only127.0.0.1:13004, mounted only its project subtree, ran nonroot/read-only/caps-dropped, and preserved restart-count state through Docker restart. It survived normal stateless command cleanup. It is now stopped; container/project preserved. This was a dependency-free server fixture, not a full Next/Vite application build.
- Real ChatGPT CartShift job q0KDoxFXPRe8rQ6sDFEI completed0, verified UID1000/aarch64 and wrote/read the persistent preflight proof.
- One redundant combined managed-service stop/start cycle was blocked by automatic approval review (reason: blocked by policy). It was omitted; the bounded standalone stop succeeded and restart persistence had already passed.

## Production preparation

The required recent-jobs index was deployed additively to cartshiftstudio/(default): 36 total indexes, four original TTL/field overrides retained. Required index CICAgNirtJAK is READY. A newly generated distinct SANDBOX_AUTH_WORKER_TOKEN is configured as a production Secret and locally owner-DPAPI protected; auth enforcement remains OFF. Existing build token and provider sessions are preserved.

## Pending gates

The owner-visible recovery-key console needs a private passphrase and independent verification. No key/passphrase is requested in chat. An external/NAS/cloud destination and proof of off-laptop copy are still required before migration. Isolated auth/build cutover, auth enforcement, dedicated task activation, physical reboot and actual Android acceptance must be explicitly recorded after completion; desktop/unit tests do not certify them.