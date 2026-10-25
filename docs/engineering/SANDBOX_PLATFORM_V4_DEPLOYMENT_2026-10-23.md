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
- 85 Python checks after integrating current main, one optional real-provider login test skipped (84 passed). Includes four snapshot and ten nonce/ACL fixture tests.
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
- Stable private owner task state is USERPROFILE/.cartshift-sandbox. Existing AppData originals are preserved. Persistent installed native ARM64 PowerShell passes a real Task Scheduler write probe under RemoteSigned, without an added policy override. Sunday03:00 now resolves to October25 at03:00CET. The full scheduled snapshot sandbox-20261024-020446-25a25a61.tar.gz.age streamed2995625444 bytes and resumed its source; authenticated scheduled verification passed and LastTaskResult is0.
- Pure Windows regression fixtures pass for UTC object/string leases, inspect-only paused certification, resumed/restarted refusal and native task argv. The existing Codex configuration also has a separately encrypted, hash-verified rollback copy.

The independent parallel-worker task identified same-device nested mounts: ismount is insufficient for Docker bind/volume subpaths. V4 now checks exact kernel mountinfo entries while preserving empty/read-only checks. Isolated worker source SHA256114a3bc97e47f3e845a5d42be0354cfb1cf2980afcf4c0e0bb81016d4395af67; PTY hash unchanged. Tini literal argument forwarding was also tested/fixed; the failed newly created sidecar is stopped and retained, with credential volumes preserved.


## October 25 final host hardening

The coordinated parallel-worker deployment is live at `dpl_7r9hvbcbXHmnx751m9bGJLQb2pku`. `ai-dev-workspace` is now the credential-blind local MCP runtime, two independently supervised build slots execute commands, and `ai-auth-sandbox` owns the provider credential volume. Auth-token enforcement is enabled. The original shared-credential container is stopped as `ai-dev-workspace-retained`; its task, sources, volumes and encrypted configuration rollback remain preserved. See `SANDBOX_PARALLEL_EXECUTION.md` for actual fencing, concurrent execution and Docker Desktop restart evidence.

- Fixed a managed-service project-subpath escape: Docker follows symlinks in volume subpaths. A fixed Python guard now compares the actual `/app` kernel mount root with the exact authorized project root before executing app code, on creation and every restart. Existing unguarded services must be retained and replaced explicitly. Four guard regressions pass. A safe empty-sibling symlink was refused before app startup; a legitimate loopback fixture passed HTTP checks, a separate stop/start and persisted restart counter. All fixtures are stopped and preserved.
- Scheduled backups now distinguish daemon unavailability from security/architecture mismatches, request the installed Docker Desktop once, and retry verified discovery for a bounded five minutes. Endpoint, image, mount and architecture checks remain mandatory. Failure cannot replace the atomic last-success receipt. Actual Windows fixtures passed for retry/start-once, timeout and fail-closed mismatch behavior; the installed `docker desktop start --detach --timeout 30` was independently exercised while Desktop was running.
- Real production artifact job `Qw0MqxfcbZTqYBsGp0In` created 25,600 binary bytes. Chunk reads `q1OpPuAa3SxYheZI7IZe`, `bZqgR8uzIi8YD4uBx2fB` and `L7T9QoAsbgnTeW2pKPgW` returned 12,000/12,000/1,600 bytes. Every returned byte was verified against its expected pattern; all SHA-256 chunk digests matched. Full file SHA-256 is `22c27b021752596140145a93194d9cdf33b0b1b454f50fd1b430491eb3eb3cb9`. Actual recent-jobs query passed.
- Python suite: 95 tests ran in 28.116 seconds, exit 0, one optional provider test skipped. The legacy-mount regression now models an unsegmented mount table explicitly so it also runs correctly inside the isolated primary. Windows UTC/pause/task-argv and new Docker-start retry fixtures pass.
- GitHub, Supabase, Firebase and Shopify identities were checked in the isolated sidecar. Firebase's initial failure was a debug-log permission error from the read-only working directory, not loss of its identity. PTY login now fixes `FIREBASE_DEBUG_PATH` inside its private provider cache. The regression failed before the fix and passes afterward. Reviewed installed guardian SHA-256 is `336ab94c2da6cf0939fb1240ee5e482ef7363cdb4fdd76c07ce9c2a576af44e0`; prior guardian source and task XML remain preserved. Worker and tools-manifest hashes are unchanged. Vercel currently reports logged out; its fresh device authorization expired without approval. No provider credentials were printed or copied into execution containers.
- The eleven-volume encrypted archive `sandbox-20261025-011828-5aee50fc.tar.gz.age` was independently authenticated/decrypted and fully tar-verified. Its 3,593,226,657-byte Documents copy has matching SHA-256 `a956106f82b6e74e0744d4cad4f6525708cdc57b0360e1b76d7d104ca8895235`. Native Windows Cloud Files confirms the encrypted recovery key is in sync, but does not yet report this newest archive in sync.

Actual ChatGPT Android UI acceptance and a physical Windows reboot/login remain owner checks. Docker Desktop restart/recovery is already tested. Do not merge or mark those checks passed on the strength of desktop MCP or unit tests.


### Final scheduled backup, restore and live checks

The updated Windows scheduled task ran to completion with **LastTaskResult 0**. New archive `sandbox-20261025-030224-9e5674ec.tar.gz.age`: **3,828,261,337 bytes**, SHA-256 `bac47b4da99aa75b2ab30ae9718ebed221ac9c564533d8fdd81c484a87d1a184`. Authenticated decryption and full archive validation completed at `2026-10-25T03:14:48.5407230Z`; both last-attempt and atomic last-success receipts report verified success. Next run is Sunday November 1 at 03:00 local time. This real run exercised the complete updated wrapper with Docker already available; unavailable/start-once/timeout/security refusal were tested separately using controlled fixtures.

A full eleven-volume restore of the earlier authenticated archive completed into **`ai-dev-sandbox-restore-f32eedc645a04cfe8ca6c5a62dc85083`**. Independent read-only inspection verified all 11 volume roots, README, and all seven dedicated provider homes at UID1000/mode0700. No original volume was overwritten and no restored credential copy was used for authentication. The staging volume remains preserved.

A separate current owner configuration/task bundle, `owner-configuration-20261025-031606.tar.gz.age`, is 82,136 bytes with SHA-256 `5236a95db1aade7cfca967acd0185f68b84d254bd3fbcdc9a749c28850d9afc8`. It also passed authenticated decryption/archive validation without plaintext staging. Both new encrypted archives and checksum sidecars were copied to the requested Documents/CartShiftSandboxBackups folder with independently matching hashes. Cloud upload completion remains a separate pending check.

The first attempted auth-task replacement exited before replacing the old Docker exec process. After waiting for the task to stop and restarting it, read-only process inspection confirmed the **running** guardian SHA-256 `336ab94c2da6cf0939fb1240ee5e482ef7363cdb4fdd76c07ce9c2a576af44e0`. Do not infer code activation solely from a registered task action. Actual Firebase PTY session `f20e6a5f-b764-44a5-9f58-023095f5785a` then completed0 with its existing login. GitHub, Supabase, Shopify and Firebase status probes all authenticated after the sidecar restart.

Actual Firebase CLI production query confirms **37 indexes**, with TTL enabled for `sandbox_auth_sessions.purgeAt`, `sandbox_command_jobs.purgeAt`, and `store_analysis_reports.expiresAt`. Post-maintenance production job `CfX5dJkBUH1veuGQMnzs` completed0, verified UID1000/aarch64 and the unchanged 25,600-byte artifact hash. Both execution slots and the isolated enforced auth channel are online. GitHub CI at `f3b66d01` passed; the full job is intentionally skipped for this draft.

Remaining owner acceptance: renewed Vercel sign-in, a physical Windows reboot/login, actual ChatGPT Android checks, and latest OneDrive upload confirmation. PR remains draft and unmerged.
