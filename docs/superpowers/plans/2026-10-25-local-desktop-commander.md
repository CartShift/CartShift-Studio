# Existing connector to local Desktop Commander

**Goal:** ChatGPT Android uses its existing CartShift MCP connection to reach the pinned open-source Desktop Commander engine in Docker, without Codex Remote or the hosted Desktop Commander relay.

**Architecture:** Keep the current authenticated job/cancellation/artifact transport and isolated V5 workers. A fixed, hash-verified Windows supervisor starts a persistent stdio MCP client/engine in the existing credential-isolated `ai-dev-workspace` container. Workers submit bounded requests over a UID-1000, mode-0600 Unix socket in a private shared-volume directory. The existing `sandbox_run_command` invokes a small CLI adapter. No public ports, new cloud shell gateway, provider credentials or host mounts are added.

**Alternatives:** Per-job engine startup loses interactive session state. The hosted relay has provider quotas and is rejected by the owner. Codex Remote is explicitly excluded. A private persistent engine behind the existing connector preserves the required sessions and transport.

- [x] Merge current website changes with the existing V5 backend; API regression tests and production typecheck.
- [x] Test-first socket/engine adapter: real file edits, interactive sessions, concurrent calls, duplicate-instance refusal, child recovery, bounded requests and unsafe-path refusal.
- [x] Reuse Windows task and isolation checks for a hash-pinned engine supervisor, periodic/logon recovery and Docker availability.
- [x] Restore the current production MCP backend while preserving current website changes; verify through the existing connector.
- [x] Verify cross-worker native Desktop Commander calls and persistence/recovery; update both PRs, encrypted configuration and Android runbook.

Requests are never replayed automatically after a timeout or disconnected response. The hosted sidecar remains stopped, with its pairing home preserved. Existing containers, volumes, provider homes and backup identities are retained.
