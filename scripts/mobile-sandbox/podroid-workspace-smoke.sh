#!/bin/sh
# Inspect a restored, screened Android workspace in the exact imported image.
# Offline and strictly read-only; does not start any sandbox worker.
set -eu
image="sha256:3000817362f55553501261f8cbe0ff421a1cbdefb34b759073a5bd574ba836ee"
volume="podroid-workspace-mobile-20261029-024634"
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
[ "$(uname -m)" = aarch64 ] || fail 'Expected Android aarch64 VM'
docker image inspect --platform linux/arm64 "$image" >/dev/null || fail 'Imported ARM64 image unavailable'
docker volume inspect "$volume" >/dev/null || fail 'Restored volume unavailable'
printf 'Checking restored workspace without network or write access...\n'
docker run --rm --pull never --platform linux/arm64 \
  --network none --read-only --user 1000:1000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --hostname ai-docker-sandbox --pids-limit 64 --memory 768m --cpus 1 \
  --log-driver none \
  --mount "type=volume,source=$volume,target=/snapshot,readonly,volume-nocopy" \
  --entrypoint /bin/sh "$image" -ec '
    base=/snapshot/ai-dev-sandbox-workspace
    test "$(id -u)" = 1000
    test "$(hostname)" = ai-docker-sandbox
    test -f /snapshot/migration-manifest.json
    test -r "$base/README.md"
    test -d "$base/projects"
    test ! -e "$base/.auth"
    test ! -S /var/run/docker.sock
    command -v node >/dev/null
    command -v python3 >/dev/null
    printf "uid=%s arch=%s hostname=%s\n" "$(id -u)" "$(uname -m)" "$(hostname)"
    printf "node=%s python=%s\n" "$(node -v)" "$(python3 --version)"
    printf "project folders:\n"
    find "$base/projects" -mindepth 1 -maxdepth 1 -type d -print |
      sed "s#^.*/##" | sort | head -n 30
    printf "PASS: restored source visible to isolated, credential-blind runtime.\n"
  ' || fail 'Read-only workspace smoke test failed'
printf 'No mobile worker was started; no files or volumes changed.\n'
