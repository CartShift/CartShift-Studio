# Sandbox V4 workstation deployment record — 2026-10-23

## Current stage

PR122 remains unmerged. Source/security fixes and Windows checks pass for compatible backend staging. Current main c4d39db3 was integrated, preserving Northflank and Apps Script support. Independent recovery-key verification and off-laptop synchronization passed on October24. Isolated-role activation is the next controlled stage. No original container, volume, authentication home or working controller has been deleted or replaced by an isolated candidate.

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
- 84 Python checks after integrating current main, one optional real-provider login test skipped (83 passed). Includes four snapshot and ten nonce/ACL fixture tests.
- Production tsconfig.build.json typecheck passed after standard translation generation; generated translation files restored byte-for-byte. Broad developer typecheck still needs existing functions email dependencies; no sandbox production TS error remains.
- Windows parsing, fixed native stdin/argv forwarding, mount/privilege refusal, normal Windows paths and mocked WhatIf checks passed.
- Real managed dev container ai-dev-v4-managed-proof served only127.0.0.1:13004, mounted only its project subtree, ran nonroot/read-only/caps-dropped, and preserved restart-count state through Docker restart. It survived normal stateless command cleanup. It is now stopped; container/project preserved. This was a dependency-free server fixture, not a full Next/Vite application build.
- Real ChatGPT CartShift job q0KDoxFXPRe8rQ6sDFEI completed0, verified UID1000/aarch64 and wrote/read the persistent preflight proof.
- One redundant combined managed-service stop/start cycle was blocked by automatic approval review (reason: blocked by policy). It was omitted; the bounded standalone stop succeeded and restart persistence had already passed.

## Production preparation

The required recent-jobs index was deployed additively to cartshiftstudio/(default): 36 total indexes, four original TTL/field overrides retained. Required index CICAgNirtJAK is READY. A newly generated distinct SANDBOX_AUTH_WORKER_TOKEN is configured as a production Secret and locally owner-DPAPI protected; auth enforcement remains OFF. Existing build token and provider sessions are preserved.

## Pending gates

The owner completed the private passphrase console; the exported recovery key passed independent age decryption. Both original encrypted archives and the encrypted key were copied with matching SHA256 to the requested Documents folder, which resolves to OneDrive/Documents/CartShiftSandboxBackups. Windows Cloud Files returned PLACEHOLDER|IN_SYNC (state9) for every copied file. No passphrase or key was exposed. Isolated auth/build cutover, auth enforcement, dedicated task activation, physical reboot and actual Android acceptance must be explicitly recorded after completion; desktop/unit tests do not certify them.

## October24 compatible production staging

- Production deployment dpl_2WFJ9tG9v5Wsii1RDDi7H9Pfhj1F was promoted to portal.cart-shift.com and the existing aliases. A real command still passed on V3 before worker upgrade.
- V4 legacy is active in the unchanged original three-volume runtime. Pinned worker SHA256 1f2fdf0799f5901df145088d21bbe908081dc5f7eed4d6e5e6511c7537d7230c; PTY SHA256 26c586f9b3c926b6164d2452851df30017eb031d63dc39873220c5c16ec053c9. Original controller retained as cartshift-worker-supervisor-before-v4.ps1. No token argument/environment or checksum override.
- Actual CartShift commands preserved/read the preflight file after container restart, timed out with124, cancelled while leased with130, cancelled while queued, and completed a125-second command with0.
- GitHub PTY d9793300-8eb9-482b-a7cc-a98147d56f84 completed0 by declining reauthentication; session2e0bcc35-b073-4a38-9a69-7d3d29811a79 stopped through the actual app. GitHub, Supabase, Vercel, Firebase and Shopify status wrappers authenticated. Northflank and Apps Script status did not confirm authentication/project access.
- Actual host tests found and fixed: PowerShell join precedence in cleanup; DateTime reparse losing UTC kind; attempted exec during paused certification; paused-supervisor restart; private AppData virtualization invisible to scheduled tasks; restrictive umask on readiness files; DST-shifted weekly trigger. The rejected backup attempts certified no archive. A source-only host checkpoint now refuses resumed/restarted writers without exec. A real stop/start of the supervisor during pause preserved the same paused container/start time.
- Stable private owner task state is USERPROFILE/.cartshift-sandbox. Existing AppData originals are preserved. Persistent installed native ARM64 PowerShell passes a real Task Scheduler write probe under RemoteSigned, without an added policy override. Sunday03:00 now resolves to October25 at03:00CET. The full scheduled snapshot sandbox-20261024-020446-25a25a61.tar.gz.age streamed2995625444 bytes and resumed its source; authenticated scheduled verification is in progress at this record point.
- Pure Windows regression fixtures pass for UTC object/string leases, inspect-only paused certification, resumed/restarted refusal and native task argv. The existing Codex configuration also has a separately encrypted, hash-verified rollback copy.
