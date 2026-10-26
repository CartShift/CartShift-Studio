# Browser QA inside the CartShift ARM64 Docker sandbox

## Why the previous attempt failed

The owner-only Docker sandbox runs Linux **ARM64**, but the previous test launched the x86-64
binary from `@sparticuz/chromium`. The container also mounts `/tmp` with `noexec`.
Moving that executable out of `/tmp` does not change its architecture. This is a browser
installation problem, not a reason to grant Docker/host access to the sandbox worker.

We use the official Debian **arm64** `chromium` package and `puppeteer-core` with an
explicit `/usr/bin/chromium` path. The browser must run under the normal UID 1000 sandbox
account; only the package installation requires root.

## One-time setup in the existing container

From the current CartShift repository on the **owner's Windows Docker host**, the simplest command is:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/browser-qa/install-host.ps1
```

That script verifies the exact expected restricted Docker identity, performs the root-only Debian package installation, then invokes the real browser acceptance test as UID 1000. If the Docker container has a different name, use `-Container <name>`. The host script copies its own reviewed verifier into the container temporarily as UID 1000 code, uses the existing project's `node_modules` for Puppeteer, and removes the temporary copy afterward. It does not switch branches or overwrite work in the container. The host checkout must contain these scripts.

The installer is intentionally a fixed command embedded in the owner-controlled
**host** script. Never execute a file from the worker-writable `/workspace` as root:
that would create a privilege-escalation path. You can inspect the PowerShell
script before executing it. Confirm the container name using `docker ps` and
pass `-Container <name>` when needed. The script refuses unexpected UID,
architecture or hostname, and installs Chromium, Hebrew-capable Noto fonts,
emoji fonts and CA certificates.

The owner-only CartShift command runner must **not** be given root, the Docker socket,
privileged mode, or Windows host mounts just to run a browser.

## Make the install survive container recreation

Packages installed with `docker exec` persist across restarts of the *same container*,
but disappear if Docker recreates it. Add the following to the Dockerfile that builds
the current sandbox image, **without replacing its existing user, tools, entrypoint,
resource limits, auth supervisor, or mounts**:

```dockerfile
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       chromium fonts-noto-core fonts-noto-color-emoji ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_DOWNLOAD=1 \
    BROWSER_EXECUTABLE_PATH=/usr/bin/chromium
# Restore the original sandbox UID 1000/user and remaining Dockerfile setup here.
```

Rebuild/recreate only through the owner's current Docker configuration, while preserving
the sandbox volumes and verified worker authentication. Avoid `docker commit` as the
long-term source of truth.

## Actual acceptance test

After the package is installed and the worker reconnects:

```sh
cd /workspace/projects/cart-shift-studio
node scripts/browser-qa/verify.mjs
```

Or execute that exact command through CartShift `sandbox_run_command` as UID 1000.

The self-contained test has no internet dependency and must:

1. Launch real native Chromium and record its actual version and architecture.
2. Render both LTR English and RTL Hebrew at 320, 375, 390, 768, 1024, 1440px.
3. Click a DOM button and verify that the page state visibly changes.
4. Reject document-level horizontal overflow and HTTP/navigation errors.
5. Save actual browser screenshots and a machine-readable report under
   `/workspace/artifacts/browser-qa`.
6. Exit nonzero on any failure; no green result if Chrome fails to start.

To check a locally served CartShift page (without inventing a logged-in session):

```sh
node scripts/browser-qa/verify.mjs \
  --url http://127.0.0.1:3000/he/portal/login/ --widths 320,390,768,1024
```

Protected dashboard routes normally redirect to login when no authenticated
browser state is supplied; the QA script treats that as a **failure** instead of
claiming it tested the dashboard. The self-contained test proves the Docker browser,
not an authenticated production dashboard session. Full product QA requires
approved test-account authentication, RTL/LTR, light/dark, touch, dialogs, etc.

## Security, limits and troubleshooting

- The browser runs as the existing restricted worker user. Chromium currently uses
  `--no-sandbox` because nested Docker user namespace sandboxing may be unavailable;
  this reduces Chromium's internal isolation. Restrict this tool to trusted development
  content and explicitly authorized targets. Never expose a remote debugging port.
- Screenshots can contain personal data: keep the artifact directory private, review
  content before sharing, and delete sensitive images. This test never logs passwords.
- `BROWSER_EXECUTABLE_PATH` overrides detection; do not point it to
  `/tmp/chromium` or a binary bundled for an unrelated architecture.
- `chromium --version` must work **as UID 1000**; `file /usr/lib/chromium/chromium`
  should identify ARM aarch64 on the correct image.
- If the CartShift worker is offline, a command left in `queued` state is not
  proof of execution. Check `sandbox_status` and the owner's Docker/worker supervisor;
  do not report browser QA success before a completed job and saved screenshots.
- `pnpm exec vitest run tests/scripts/browser-qa.test.mjs` validates the checker
  without requiring a browser, but it is **not** a substitute for the acceptance test.
