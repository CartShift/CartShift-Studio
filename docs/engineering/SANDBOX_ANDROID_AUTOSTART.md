# Podroid: automatically start the actual mobile Docker worker on VM boot

## Requirement

Owner taps **Start VM** in Podroid. Alpine OpenRC starts Docker automatically; the
CartShift worker service then starts **without a terminal command on each boot**.
A crashed worker is restarted by the service runner after 15 seconds.
There is no new ChatGPT connector, listening shell, Docker TCP API, or published port.

## State / safety

As of this PR, this is **implemented but not activated or tested on the owner's phone**.
Do not confuse an installed OpenRC unit with an online worker. The existing Windows
worker is allowed by default; the server refuses mobile credentials until an
explicitly reviewed active-host switch. The mobile worker operates only as a
build-role command worker: no provider-authentication home, auth sessions or
Desktop Commander engine.

### Why OpenRC rather than --restart unless-stopped?

Podroid's Docker daemon does already start automatically at VM boot. However,
the existing Python worker deliberately consumes its bearer on stdin before
accepting jobs, so we cannot safely configure an ordinary long-lived container
with a token in its environment or a permanently mounted readable secret file.
The root-owned OpenRC runner injects the token over stdin at each container
start and never exposes that token to a command process.

Docker's plain restart policy alone is sufficient for non-sensitive apps.
For THIS worker, use the guarded OpenRC service.

## Step 1: install boot infrastructure only

Inside **Podroid**, as root:

    wget -O /root/podroid-install-worker-autostart.sh \
      https://raw.githubusercontent.com/CartShift/CartShift-Studio/68460dec51be1d9090cce63a63836eeaf63aea81/scripts/mobile-sandbox/podroid-install-worker-autostart.sh
    sh /root/podroid-install-worker-autostart.sh

This installs the service and runner but does **not** arm, enable, start,
authenticate or connect a worker. It refuses to overwrite a prior installation.

Expected files:

- /etc/init.d/cartshift-mobile-worker
- /usr/local/sbin/cartshift-mobile-worker-loop
- /etc/cartshift-mobile (root-only configuration directory)

## Step 2: ONE-TIME prerequisite to activate (owner-controlled)

- Confirm original screened and independently verified writable Android volume
  podroid-workspace-dev-20261029-024634 and empty auth shadow
  podroid-mobile-empty-auth-20261029-024634 remain correct.
- Use the reviewed V3 mobile wrapper built by `prepare-mobile-worker.py` from
  the actual Windows source and adapter pins described below. The unwrapped
  Python worker emits V4 requests; it is not the production V3 wire contract.
- Provide /etc/cartshift-mobile/worker.py: pinned, reviewed worker source;
  root-owned, mode 0644; its exact approved file SHA-256 as lowercase 64-hex
  in /etc/cartshift-mobile/worker.sha256. The runner verifies the SHA before
  every launch. Ensure the image has python3 and /opt is present.
- Provision a new, distinct mobile **BUILD-only** bearer securely in
  /etc/cartshift-mobile/worker.token, root-owned mode 0600. Never place it in a
  repo, screenshot, ChatGPT message, Docker environment or Docker mount. The
  Windows and mobile bearers must never be identical.
- Deploy the reviewed server-side host credential gate before mobile arming.
  By default SANDBOX_ACTIVE_WORKER_HOST=windows. On mobile cutover, configure
  SANDBOX_MOBILE_WORKER_TOKEN to the distinct mobile bearer,
  SANDBOX_ACTIVE_WORKER_HOST=mobile, SANDBOX_AUTH_WORKER_ENFORCE=true,
  SANDBOX_PARALLEL_ENABLED=false. The backend must reject the Windows bearer
  while accepting the mobile one. Reverting to Windows means another
  explicitly controlled server-side mode switch. Unmerged source changes
  do not affect the deployed server.
- Fresh checkpoint and independent off-host restore verified. Stop/drain/fence
  the Windows worker, all scheduled restart supervisors, auth sessions and
  outstanding leases BEFORE switching server mode. Verify no data divergence
  and no old command can still run. Switching server tokens alone is not
  physical fencing of already-running jobs.
- Verify network, UID1000, temp filesystem, current worker/PTY source hashes
  and mobile build isolation before first real command. If any gate fails,
  **do not arm** the service.

## Step 3: arm only after ALL gates pass

Inside Podroid, after server cutover and Windows fencing:

    install -m 0600 /dev/null /etc/cartshift-mobile/host-armed
    rc-update add cartshift-mobile-worker default
    rc-service cartshift-mobile-worker start

Check:

    rc-service cartshift-mobile-worker status
    docker ps --filter name=cartshift-mobile-worker
    docker logs --tail 30 cartshift-mobile-worker

Neither a successful init status nor a Docker running state proves remote
ChatGPT reachability. Confirm a uniquely identifiable write/edit/read via the
existing authenticated CartShift MCP and confirm the actual mobile filesystem
receives it, then STOP/START THE PODROID VM and repeat the connection proof.
When the VM is started later, OpenRC will start this service automatically.
The runner retries a failed container start every ~15 seconds while armed;
its local stdout logs must never print a bearer.

## Disable / reverse handoff

Before making Windows active again, drain mobile jobs and checkpoint all mobile
changes back to the Windows-authoritative workspace. Stop and disable the
mobile service while the Podroid VM is running:

    rc-service cartshift-mobile-worker stop
    rc-update del cartshift-mobile-worker default
    rm -f /etc/cartshift-mobile/host-armed

Verify the mobile Docker container and any children are **stopped**, then
review queued/leased jobs and update server mode back to Windows. Only then
re-enable the Windows scheduled supervisor. If Podroid is unavailable,
the backend active-host mode must first reject the mobile bearer and all
outstanding mobile jobs must be resolved safely before Windows can proceed.
Never simply assume a stale heartbeat means the phone was physically stopped.

## Limitations

- The phone VM must be launched by the user; this does not make Podroid itself
  start automatically after an Android reboot or app kill.
- QEMU software emulation and Android background termination remain risks.
- The current mobile workspace is an audited source-editing snapshot.
  Dependencies/Git history and some remote partial-clone contents are absent,
  with 745 conservatively redacted source files. Full builds, deployment and
  authentication are not yet certified.
- No automatic Windows↔Android state synchronization or safe takeover of a
  running job is included here. Boot/start is automatic **only once the
  mobile host has been explicitly activated safely**.
- The host-armed marker is an operator enable switch, not a cryptographic
  fence. The server's distinct-host bearer gate plus physical fencing are
  mandatory protections.

## Laptop preparation and updating the already-installed disarmed service

The Windows task inspection reconciles these immutable inputs:

| Input | SHA-256 |
|---|---|
| Installed Python worker (LF bytes) | `3efdcaf5533383549aeae85488d78acce5a9ee2c8b1946a35f9735e978a9b4ff` |
| Installed V3 transport adapter | `f7215b44c865ab463a4be285caa313b010ea471b1ed29490ffe976513398e289` |

The repository worker matches the installed worker after LF normalization.
A Windows CRLF checkout has a different byte hash; do not certify that file
against the LF pin. Build from the actual owner-pinned bytes:

```sh
python3 scripts/mobile-sandbox/prepare-mobile-worker.py \
  --worker /owner-reviewed/worker.py \
  --worker-sha256 3efdcaf5533383549aeae85488d78acce5a9ee2c8b1946a35f9735e978a9b4ff \
  --adapter /owner-reviewed/protocol_v3.py \
  --adapter-sha256 f7215b44c865ab463a4be285caa313b010ea471b1ed29490ffe976513398e289 \
  --output worker.py
```

The deterministic generated wrapper verifies both inputs, requires serial build
role, applies the exact Windows V3 payload conversion and reports V3 activity.
It never imports the auth guardian in build role. `--identity-only` performs the
real mount/UID/architecture checks using a dummy credential without polling.
The V3 adapter deliberately omits V4 running-cancellation/artifact capabilities.

`podroid-provision-disarmed.sh` is the update path for the already installed
service. The original installer intentionally refuses overwriting an existing
installation and continues to pin its original immutable revision; rerunning
it will not deliver this reviewed update. The owner-sealed provisioning bundle
must contain the new worker, source pin, distinct mobile token, runner, init
unit, this updater and checksums. Decrypt only into a new root-owned 0700 host
directory, never into `/workspace` or a Docker volume. Run the updater there.
It verifies the known installed unit/loop hashes, refuses any armed/running/
enabled-in-any-runlevel service or reserved container, backs up the old boot
files, installs root-owned provisioning and runs the non-launching check.
It does not enable or start the service.

The runner additionally requires root-owned 0700 configuration, 0644 source/pin,
and a single valid token line in a root-owned 0600 file. It mounts a fresh,
credential-blind tmpfs home and caps swap at the memory limit. A reserved
container causes refusal rather than implicit deletion or adoption.

The server host gate rejects a mobile token equal to either Windows build or
auth token. Mobile mode disables the auth-session endpoint and fresh/cached
auth-session advertisement. Prepare the new secret with active host still
`windows`; do not deploy/switch as a side effect of preparing a credential.
Existing Windows/auth tokens and owner configuration must remain untouched.

Offline tests: `python -m unittest discover -s tests/scripts -p 'test_mobile*.py' -v`.
The shell tests use fixture metadata and fake Docker, and the real-source loader
test does not simulate a successful Linux mount identity. They prove parsing,
pin/role/protocol behavior, duplicate refusal, stdin delivery and disarming,
not physical Android acceptance. Run the actual network-disabled identity probe
on Podroid before arming, then the existing connector proof and VM restart
test only after the server switch and physical Windows fencing.
