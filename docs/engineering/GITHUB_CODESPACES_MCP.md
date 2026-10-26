# GitHub Codespaces integration — Stage 1 (lifecycle control)

**Status: code in draft PR; not configured, deployed, or live-tested.**
This is an additive, owner-only extension of the existing CartShift MCP. It
**does not** provide Codespace terminal execution yet. In particular, the
existing "sandbox_run_command" remains bound to the verified local V5 pool.

## Why a separate adapter?

The standard GitHub connector available to ChatGPT does not expose Codespaces
management endpoints or arbitrary terminal execution. GitHub's REST API does
support listing, creating, starting and stopping Codespaces, but these actions
need a separate Codespaces-scoped *user* credential. The already-connected
GitHub app token is not shared with this application backend.

The current ARM64 Linux worker is bound to an explicit local Docker identity;
do not copy it into a Codespace and weaken or bypass the identity checks.
Likewise, the local V5 queue must not dispatch to a foreign worker that lacks
its exact lease, fencing and resource reservation protocol.

## Cost constraints and account choice

Use a repository owned by your **personal GitHub user**, not CartShift's
organization: organizations do not receive the free personal Codespaces
allowance. A personal GitHub Free account currently includes 120 core-hours
and 15 GB-month storage each month. One 2-core machine uses 2 core-hours per
elapsed hour (at most ~60 free compute hours/month before other Codespace
usage). Running time *and* storage are metered; storage continues while a
Codespace is stopped. GitHub's free usage and budgets, not this adapter,
determine actual billing.

Read https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
and confirm the account's current quota and billing-owner assignment.
Set GitHub's Codespaces product budget to $0 (with "Stop usage when budget
limit is reached" enabled) and configure billing notifications. Inspect the
account's current usage before provisioning. Do not assume our config is a
billing guarantee. Do not use a CartShift organization-owned repo for the
personal free quota.

The adapter:
- Requires an exact allowlisted personal repository and matching GitHub user.
- Verifies every Codespace owner *and* billable owner before using it.
- Allows only 2-core machines to be created/started.
- Sets new machines to EuropeWest, 15-minute idle timeout.
- Refuses to create a duplicate for the allowed repository.
- Never automatically creates/starts Codespaces or performs fallback.
- Does not delete Codespaces or uncommitted state.
- Is disabled until an explicit lifecycle environment switch is set.

## Owner configuration (production, protected secrets)

Set these only in the verified **CartShift-Studio** Vercel project, not in chat
or Git. Prefer a GitHub App user access token for longer-lived operation;
for this first owner-only prototype, a short-lived fine-grained personal token
restricted to the single personal repository is sufficient.

- GITHUB_CODESPACES_REPOSITORY=yotamon/WakeMyWay
  (initial suggested *personal* test repo; adjust only if desired)
- GITHUB_CODESPACES_TOKEN=<secret set in Vercel UI>
- GITHUB_CODESPACES_LIFECYCLE_ENABLED=false (default; read-only first)

Token permissions for GitHub's Codespaces API:
- Repository "Codespaces": read/write for list/create.
- Repository "Codespaces metadata": read for available machines.
- Repository "Codespaces lifecycle admin": write for start/stop.
- Select only the designated personal repo. Avoid "All repositories" and
  unrelated Contents/Administration/Secrets permissions.

Follow the GitHub token creation UI directly:
https://github.com/settings/personal-access-tokens
Do not send the generated token through ChatGPT or command output.
Set a short expiration; rotate before expiration.

Keep the existing SANDBOX_OWNER_UID and separate local SANDBOX_WORKER_TOKEN
unchanged. No GitHub token is injected into a Codespace or used by a local
general-purpose execution worker.

## ChatGPT acceptance (must be done after deployment)

1. From the existing CartShift app, call "sandbox_codespaces_status" and check
   "configured=true" and "lifecycle_enabled=false". Do not mistake that for
   validated remote API access.
2. Call "sandbox_codespaces_list". This makes an authenticated GitHub API
   request, verifies the actual GitHub login and filters the allowed repo.
   An empty result is valid if no Codespace exists.
3. Inspect the GitHub account billing budget and free usage.
4. Only after the owner explicitly opts in, set
   GITHUB_CODESPACES_LIFECYCLE_ENABLED=true and redeploy.
5. With explicit user instruction, call "sandbox_codespaces_create". It
   refuses duplicate creation and requires a 2-core machine. Confirm returned
   web URL/repo and personal billable owner. Do not create under org billing.
6. From ChatGPT Android, call list, stop and start in response to explicit
   user requests. Confirm GitHub's live state in https://github.com/codespaces.
7. Stop after the test and examine current charges in the GitHub billing UI.
8. If incorrect, remove the lifecycle opt-in or the token. Local Docker
   command tools must continue working without any Codespaces credentials.

**No real Codespace was provisioned or executed by this PR.**
The connector currently lacks direct Codespaces management tools and this
stage cannot validate the live personal usage quota or payment method.

## Stage 2: actual remote job execution (separate PR)

Codespaces REST APIs **do not provide an arbitrary shell-command endpoint**.
We must add a distinct execution transport, for example a Codespace-hosted
outbound HTTPS worker that:
- Has its *own* short-lived worker credential and identities, never the
  local worker's shared bearer or the GitHub management token.
- Uses distinct job queues/backends and explicit routing, no cross-backend
  claims or automatic retries after uncertain outcomes.
- Never exposes a publicly forwarded command port.
- Authenticates GitHub billing owner, instance identity and lease before work.
- Stops the Codespace on job completion; handles idle timeout and the
  mandatory 12-hour maximum lifetime.
- Preserves repository changes through Git PRs and verifies exit code,
  stdout/stderr, artifacts, and phone-side tool discovery.
- Provides background-job recovery and actual cancellation without claiming
  physical test completion before it happens.

The local ARM64 execution environment stays the default and is not replaced.
No blanket synchronization of .auth/provider credential volumes to GitHub.

## Deployment / compatibility

This work is stacked on PR #124, which is stacked on PR #122. Merge/rebase in
that order after their pending real-device checks. This stage changes only
the GitHub Codespaces MCP lifecycle surface. It must NOT automatically deploy
CartShift-Studio or merge the unreviewed parent branches.

Targeted checks when a properly provisioned runner becomes available:

  pnpm exec vitest run tests/api/cartshift-mcp-codespaces.test.ts
  pnpm exec tsc -p tsconfig.build.json --noEmit

Test matrix: owner-denial, token-owner mismatch, repo/billing mismatch,
2-core enforcement, lifecycle default-off, no auto-start/list-only,
audited create/stop, invalid URL rejection, and existing local regression
tests. No live tests or production acceptance are implied by unit tests.

Sources:
- https://docs.github.com/en/rest/codespaces/codespaces
- https://docs.github.com/en/rest/codespaces/machines
- https://docs.github.com/en/codespaces/about-codespaces/understanding-the-codespace-lifecycle
- https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
