# Durable mobile command completion

Podroid 1.2.9 QEMU Stop terminates the emulator instead of requesting a guest shutdown. A completed 40-byte MCP write/read was observed as an empty file after a Stop/Start cycle. A second 43-byte write explicitly flushed with fsync/sync survived the next real boot unchanged. The volume is persistent; the lost content was an unflushed write at a power-cut boundary.

The generated mobile worker now calls Linux syncfs on a no-follow directory descriptor for /workspace after command execution and descendant cleanup, before returning a completion for HTTPS delivery. This also flushes partial changes from nonzero-exit commands. A failed or unavailable flush stops the worker with no completion acknowledgement. The descriptor is closed on success or failure. This changes only the mobile wrapper, leaving the reviewed core, V3 adapter, Windows installed workers and server routing unchanged.

Portable tests verify ordering before completion, refusal after a storage error, flushing nonzero-exit results, descriptor flags/lifetime, and missing syncfs. The actual encrypted updater must exercise a network-none execution smoke test on the phone before resuming the same service. Keep existing credentials, source backups and workspace volumes.

Completed mobile commands obtain a durable workspace boundary. Stopping a VM during an active command or while other processes have unflushed edits remains unsafe; prefer a graceful guest shutdown for unrelated editor/system writes. This cannot promise atomic multi-file application transactions or durability against a failing storage device.
