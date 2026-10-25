# Remote Desktop Commander in the isolated sandbox

## Purpose

Restore the familiar Desktop Commander file/search/patch/terminal/session experience
from ChatGPT Android **without** running the agent on the owner's personal Windows
filesystem. The existing Linux ARM64 sandbox image already contains the open-source
`@wonderwhy-er/desktop-commander` package at `/opt/dc`; the host's existing
`Start-SandboxLocalMcp.ps1` is for **local stdio** and does not provide mobile
ChatGPT access. Do not build or expose a second custom public shell gateway.

This is an **opt-in third-party hosted relay**, independent of CartShift's MCP.
Official docs: https://github.com/desktop-commander/remote-desktop-commander
The remote service is currently beta; it temporarily processes and stores tool
arguments and results to relay them. Assume private project paths, terminal
output and file content sent through this connector may reach that provider.
Do not pair it until the owner explicitly accepts that trust boundary.

## Architecture

```text
ChatGPT Android --OAuth--> https://mcp.desktopcommander.app/mcp
                                  |
                           outbound device tunnel
                                  |
Windows Docker Desktop --> ai-dev-sandbox-dc-remote (Linux ARM64)
                             |-- /workspace   shared development files
                             |-- /workspace/.auth  EMPTY / READ-ONLY shadow
                             |-- /home/node  DEDICATED persistent device volume
                             |-- pinned image /opt/dc installation
                             '-- NO Windows files / Docker socket / host bind
```

The V5 build pool and V4 authentication sidecar remain **unchanged**. The
Desktop Commander remote device is neither a general-purpose V5 worker nor a
privileged authentication broker. It does not inherit Firebase/GitHub/Vercel
provider credential homes from the original legacy worker. It CAN read
workspace-local `.env`, SSH keys or tokens if you put them inside its writable
workspace: do not store live secrets there. Avoid simultaneous changes to the
same project from Desktop Commander and V5 agents; use separate directories or
Git worktrees. The V5 cooperative reservations do not wrap Desktop Commander
tool calls.

The remote agent's own OAuth device state lives in
`ai-dev-sandbox-dc-remote-home` (at
`/home/node/.desktop-commander-device/device.json`, initially absent).
That volume is initialized as UID 1000 once, from a brand-new owner-labelled
volume only. No existing home or work files are chowned, deleted, migrated or
replaced. Docker restarts the device after Docker Desktop comes back online;
a sleeping/offline Windows machine remains unreachable.

## Stage (Windows owner PowerShell, not ChatGPT commands)

**Prerequisite**: Finish and verify PR #122's V5 isolated role/parallel
cutover. The script refuses a source container without the expected read-only
credential shadow. Review that the recorded backup/recovery key is usable.

In `scripts/sandbox-host` on the **reviewed** branch, using native installed
PowerShell 7.3+, perform:

```powershell
./Manage-SandboxDesktopCommander.ps1 -Action Prepare -AcknowledgeThirdPartyRelay -WhatIf
./Manage-SandboxDesktopCommander.ps1 -Action Prepare -AcknowledgeThirdPartyRelay
./Manage-SandboxDesktopCommander.ps1 -Action Verify
```

The first command is a plan only. The second creates one owner-labelled
private device volume and one **stopped** container, capped at 1 CPU / 1 GiB
/ 128 PIDs, with a read-only root, no elevated caps, no published ports and
no host bind. It checks the existing Docker resource budget and fails if the
name or home is already present. `Verify` checks exact image, command,
container label, mount identities, privileges and resource caps. Never weaken
these checks to bypass a failure.

## Pair the device

The next steps are **real owner approvals** and cannot be claimed as done by a
GitHub commit or ChatGPT sandbox status call.

```powershell
./Manage-SandboxDesktopCommander.ps1 -Action Start -AcknowledgeThirdPartyRelay
./Manage-SandboxDesktopCommander.ps1 -Action Logs
```

Read the one-time device-verification URL and code in the **owner's local
PowerShell terminal**. Open the verification page in a browser, sign in to
Remote Desktop Commander and verify the code matches. Do **not** paste pairing
codes or login tokens into ChatGPT, issue/PR comments or cloud logs.

In ChatGPT, connect the official Remote Desktop Commander app or add the
remote MCP endpoint:

`https://mcp.desktopcommander.app/mcp`

Complete its own OAuth sign-in and select the newly paired sandbox device.
Grant access only to the correct account. Do not pair the Windows host itself.

Run harmless acceptance checks from a fresh ChatGPT Android conversation:
(1) inspect `/workspace/README.md`; (2) list project directories;
(3) write/read/replace a disposable file under `/workspace/experiments`;
(4) start and stop a harmless interactive terminal session; (5) verify
there is no Windows mount, no Docker socket and the provider credentials are
unavailable from this sidecar; (6) compare with ordinary CartShift
`sandbox_run_command` and confirm the V5 pool is still independent.

Only mark **Android acceptance** complete after those operations really pass.
Test a normal Docker Desktop restart and a normal Windows login on the owner
host; neither can be tested by merely reading this PR.

## Backups and recovery

`Backup-Sandbox.ps1` now includes the optional
`ai-dev-sandbox-dc-remote-home` volume in the encrypted source list. Missing
optional volumes are skipped, preserving backwards compatibility. If the
remote device is running, the backup recognizes its exact role/name/image
and pauses it alongside other sandbox writers while copying. The device
cannot acknowledge our worker maintenance nonce, so this is a
**crash-consistent, not transactionally quiescent** snapshot. Avoid editing or
deploying code during scheduled backups. The existing owner-protected
recovery key, off-PC encrypted archive and staging restore requirements
remain mandatory. Record verification of the newly added volume in the
next authenticated backup; pairing credentials may expire even in a valid
archive. Do not include secrets or pairing codes in the verification log.

## Stop, disable or revoke

```powershell
./Manage-SandboxDesktopCommander.ps1 -Action Stop
./Manage-SandboxDesktopCommander.ps1 -Action Verify
```

Stop deliberately preserves the pairing home and all workspace data, and
does not touch the V5 worker pool. Also revoke the device in
https://mcp.desktopcommander.app and disconnect the ChatGPT connector when
you no longer want it authorized. Local stop and remote revocation are distinct.

No destructive `Reset`, `Clean`, `Finalize` or automatic credential-deletion
path is provided. Do not enable this sidecar by automatically deploying this PR.

## Outstanding acceptance gates

- [ ] Host source container/image contains the expected Desktop Commander CLI.
- [ ] Owner has reviewed the hosted-relay privacy and provider access boundary.
- [ ] Staged sidecar passes Verify on real Windows ARM64 Docker.
- [ ] Auth code matched and the remote sandbox device is paired intentionally.
- [ ] ChatGPT Android list/read/patch/process tools pass against this device.
- [ ] V5 pool remains independently functional; no credentials leak.
- [ ] Encrypted archive includes the new device volume; restore and off-PC sync verified.
- [ ] Docker restart/logon recovery verified.
- [ ] Remote provider revoke and local Stop tested on a disposable device if desired.

This optional route delivers Desktop Commander parity quickly while preserving
the CartShift owner-only worker bridge as an independent fallback. A
fully self-hosted remote MCP adapter can be evaluated separately if avoiding
the Desktop Commander hosted relay becomes a requirement.
