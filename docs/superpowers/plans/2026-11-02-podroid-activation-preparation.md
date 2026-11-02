# Podroid activation preparation

Goal: complete the existing disarmed OpenRC design without production cutover.
Spec: docs/engineering/SANDBOX_ANDROID_AUTOSTART.md and the owner's explicit laptop-only preparation request.

- [x] Inspect installed Windows task, source/adapter hashes and deployed connector status.
- [x] Run baseline backend tests; keep unavailable Docker recovery/runtime gates explicit.
- [ ] Add failing host-credential collision/session-isolation tests; fix the authorization boundary while preserving default Windows behavior.
- [ ] Add a deterministic, hash-checked V3 mobile worker builder and offline identity mode; test bad source pins, forbidden roles, payload translation and source parity.
- [ ] Tighten OpenRC provisioning checks and startup resources; exercise the shell runner offline with a fake Docker command, never a real credential or queue.
- [ ] Generate a distinct mobile bearer; seal phone provisioning to Android + Windows age recipients and server configuration under Windows DPAPI. Never serialize plaintext credentials to disk.
- [ ] Prepare staged server environment changes with active host still Windows, then a separately gated mobile cutover recipe. Do not deploy either here.
- [ ] Run relevant tests and source validation; package source changes, encrypted provisioning and exact one-time commands.
- [ ] Review fencing, fresh recovery, Android identity/boot and real connector proof gates. Do not claim unavailable acceptance evidence.

Review focus: shared auth/mobile bearers; stale Windows auth sessions after host switch; wrong worker protocol; edited/writable provisioning files; stale/foreign volumes and duplicate containers. Each must fail closed. Physical fencing is not inferred from a stale heartbeat or unavailable Docker daemon.
