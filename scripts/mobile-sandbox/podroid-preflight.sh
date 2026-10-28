#!/bin/sh
# Safe readiness check for Podroid's Alpine Linux VM.
# Does not connect to CartShift or start any remote worker.
set -eu
say() { printf '%s\n' "$*"; }
fail() { say "FAIL: $*" >&2; exit 1; }
[ "$(uname -s)" = Linux ] || fail "Run inside Podroid Linux"
case "$(uname -m)" in aarch64|arm64) ;; *) fail "Expected ARM64" ;; esac
command -v docker >/dev/null 2>&1 || fail "Docker CLI missing"
docker info >/dev/null 2>&1 || fail "Docker daemon unavailable"
docker compose version >/dev/null 2>&1 || fail "Docker Compose missing"
os="$(docker info --format '{{.OSType}}')"
arch="$(docker info --format '{{.Architecture}}')"
[ "$os" = linux ] || fail "Docker server must be Linux"
case "$arch" in aarch64|arm64) ;; *) fail "Docker server must be ARM64" ;; esac
say "Linux: $(uname -r) / $(uname -m)"
say "Docker server: $(docker version --format '{{.Server.Version}}') ($arch)"
say "Compose: $(docker compose version --short)"
grep -E '^MemTotal:' /proc/meminfo || true
df -h /var/lib/docker 2>/dev/null || true
probe="cartshift-mobile-preflight"
docker volume create "$probe" >/dev/null
docker run --rm --platform linux/arm64 -v "$probe:/probe" alpine:3.24 sh -c 'test -f /probe/proof || printf "%s\n" podroid-volume-persists > /probe/proof'
proof="$(docker run --rm --platform linux/arm64 -v "$probe:/probe:ro" alpine:3.24 cat /probe/proof)"
[ "$proof" = podroid-volume-persists ] || fail "Named-volume round trip failed"
say "PASS: ARM64 Docker, Compose, persistent named-volume round trip."
say "Stop/restart Podroid VM and rerun to check persistence across VM restarts."
say "This cannot prove AVF/KVM. Check backend in Podroid Android UI."
say "No PC image, workspace, credentials or ChatGPT worker imported."
