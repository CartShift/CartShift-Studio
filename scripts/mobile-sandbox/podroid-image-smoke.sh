#!/bin/sh
# Safe, no-credential smoke test for the ARM64 image imported from Windows.
# Does not attach host paths/volumes, start a sandbox worker, or contact the MCP queue.
# Usage: sh podroid-image-smoke.sh [sha256:SOURCE_IMAGE_ID]
set -eu

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
image="${1:-sha256:3000817362f55553501261f8cbe0ff421a1cbdefb34b759073a5bd574ba836ee}"
[ "$#" -le 1 ] || fail "Usage: sh $0 [sha256:IMAGE_ID]"
case "$image" in sha256:*) ;; *) fail "Expected sha256: image ID" ;; esac
hex="${image#sha256:}"
case "$hex" in *[!0123456789abcdef]*|'') fail "Invalid image digest" ;; esac
[ "${#hex}" -eq 64 ] || fail "Image ID must have 64 hex characters"
[ "$(uname -m)" = "aarch64" ] || fail "Run inside ARM64 Podroid"
command -v docker >/dev/null 2>&1 || fail "Docker is not installed"

platform="$(docker image inspect --platform linux/arm64 --format '{{.Os}}/{{.Architecture}}' "$image")" ||
  fail "Image is missing or does not contain linux/arm64"
[ "$platform" = "linux/arm64" ] || fail "Expected linux/arm64; got $platform"
printf 'Verified imported image platform: %s\n' "$platform"

# Deliberately override ENTRYPOINT, disable networking, and avoid any mounts or
# authentication so this cannot register a second worker or alter a workspace.
docker run --rm --pull=never --platform linux/arm64 \
  --network none --read-only --cap-drop ALL \
  --security-opt no-new-privileges \
  --user 1000:1000 --hostname ai-docker-sandbox \
  --memory 1536m --cpus 1 --pids-limit 64 \
  --entrypoint /bin/sh "$image" -ec '
    test "$(id -u)" -eq 1000
    test "$(hostname)" = "ai-docker-sandbox"
    test "$(uname -m)" = "aarch64"
    test ! -S /var/run/docker.sock
    command -v python3 >/dev/null
    command -v node >/dev/null
    printf "uid=%s host=%s arch=%s\n" "$(id -u)" "$(hostname)" "$(uname -m)"
    python3 -c "import sys; print(\"python=\", sys.version.split()[0])"
    node -e "console.log(\"node=\", process.version)"
  ' || fail "Isolated image smoke test failed"

printf 'PASS: imported image executed with isolated identity and offline runtime.\n'
printf 'No workspace volume mounted, no provider credentials loaded, no worker started.\n'
