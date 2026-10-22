# Docker activity logs

Open Docker Desktop > Containers > ai-dev-workspace > Logs, or run on the owner PC:

```powershell
docker logs --follow --tail 100 ai-dev-workspace
```

The owner-verified worker writes timestamped JSON events directly to PID 1's existing stdout pipe. Docker exec output normally has a separate transport, which is why the worker previously appeared silent in this view. No new service, public port, mount, privilege, or Docker configuration is required.

Events cover worker startup, connected/recovered channels, rate-limited connection errors, health heartbeats, job start/progress/completion, timeout and truncation flags, result acknowledgement, login-session status changes and input acknowledgement. Long jobs emit progress every 30 seconds. Idle health is visible approximately every 30 seconds. The existing Docker rotation remains three files of 5 MB each.

Logs intentionally contain metadata only. Commands, stdout/stderr content, environment, authentication URLs, tokens and verification input are never copied into Docker logs. Read command results through CartShift and login output through the bounded redacted session tools. Arbitrary manual docker exec and local MCP terminal output are separate streams; this does not install a shell recorder or audit every filesystem operation. Queued cancellations handled entirely by the backend are not seen by the worker.

Writes are nonblocking, atomic and bounded below PIPE_BUF. Logging is best effort: full or inaccessible log pipes drop the event rather than blocking command deadlines. Field names and event names are allowlisted, string values are bounded and restricted to single-line identifier characters. Logging is enabled only by the verified production worker main entrypoint, so tests do not pollute production logs.

Deployment must retain the owner-held source checksum and in-container checksum verification. Update both through the supervisor's pinned hash variable after reviewing and testing the exact source bytes. Restart the existing container and supervisor during an idle period; do not rebuild or recreate volumes.
