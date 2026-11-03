# Podroid process visibility compatibility

Podroid 1.2.9 / Linux 7.1.5 supports PR_SET_CHILD_SUBREAPER but omits CONFIG_PROC_CHILDREN. The first real command therefore failed before execution when the worker tried to read /proc/self/task/<pid>/children. Heartbeat/identity-only checks previously did not exercise this prerequisite.

The worker now uses /proc/<pid>/stat direct-parent IDs only when the optional children file is absent. Process names are parsed after their final closing parenthesis. Only disappearing processes are skipped. Permission errors, malformed metadata and a missing own-process view fail closed. Subreaper enforcement, detached-descendant termination/reaping, process-group cleanup, credential isolation and stdin-only transport remain required. Build identity validation now checks these execution prerequisites before polling.

Tests cover the missing interface, unusual process names, process-exit races, denied/malformed visibility, and subreaper refusal. The real subprocess suite is also repeated with the children interface hidden, including timeout and setsid descendant cleanup. Linux release gating now includes the worker source and these regressions.

The original Windows runtime remains pinned to core 3efdcaf5533383549aeae85488d78acce5a9ee2c8b1946a35f9735e978a9b4ff and stays fenced; its installed sources and credentials are not changed. Android uses the newly reviewed core pin 4bc128b5db15f7bf87c34458f3919f6f825ae6fbfa87e6078bc4820b3667ba19 with the unchanged V3 adapter f7215b44c865ab463a4be285caa313b010ea471b1ed29490ffe976513398e289. Regenerate the single-file mobile wrapper from those exact bytes. Wire protocol remains 3, and no backend or credential rotation is required for this correction.

Replace only the Android worker source and its hash while its installed OpenRC service is stopped and disarmed. Preserve the bearer and back up both prior source files. Require the enhanced offline identity check before arming/resuming. Never work around this issue by skipping cleanup, adding broad capabilities, disabling seccomp or claiming that a heartbeat proves command execution.
