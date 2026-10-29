#!/bin/sh
# Clone the verified, screened Android staging volume into a separate writable
# development copy. All containers are offline and never start a worker.
set -eu
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
image='sha256:3000817362f55553501261f8cbe0ff421a1cbdefb34b759073a5bd574ba836ee'
source_volume='podroid-workspace-mobile-20261029-024634'
dev_volume='podroid-workspace-dev-20261029-024634'
shadow_volume='podroid-mobile-empty-auth-20261029-024634'
verifier='/mnt/downloads/verify-android-workspace.py'

[ "$(uname -m)" = aarch64 ] || fail 'Not an ARM64 Podroid guest'
[ -f "$verifier" ] && [ ! -L "$verifier" ] || fail 'Missing local verification script'
[ -f /mnt/downloads/VERIFICATION-SHA256SUMS ] || fail 'Missing verifier checksums'
(cd /mnt/downloads && sha256sum -c VERIFICATION-SHA256SUMS) ||
  fail 'Verification files changed. Refusing to clone.'
docker image inspect --platform linux/arm64 "$image" >/dev/null ||
  fail 'Verified ARM64 image not found'
docker volume inspect "$source_volume" >/dev/null ||
  fail 'Screened staging source volume missing'
if docker volume inspect "$dev_volume" >/dev/null 2>&1; then
  fail 'Writable destination already exists. Never overwrite or reuse.'
fi
if docker volume inspect "$shadow_volume" >/dev/null 2>&1; then
  fail 'Auth-shadow destination already exists. Never overwrite or reuse.'
fi

printf 'Creating independent volumes; original screened staging volume remains untouched.\n'
docker volume create --label migration.purpose=mobile-offline-dev "$dev_volume" >/dev/null
docker volume create --label migration.purpose=empty-readonly-auth-shadow "$shadow_volume" >/dev/null

# New volume initially belongs to root; grant access only to UID1000.
docker run --rm --pull never --platform linux/arm64 \
  --network none --read-only --user 0:0 \
  --cap-drop ALL --cap-add CHOWN --security-opt no-new-privileges:true \
  --pids-limit 64 --memory 256m --log-driver none \
  --mount "type=volume,source=$dev_volume,target=/work,volume-nocopy" \
  --entrypoint /bin/chown "$image" 1000:1000 /work ||
  fail 'Could not prepare writable destination ownership'

printf 'Copying screened source into the independent development volume...\n'
docker run --rm --pull never --platform linux/arm64 \
  --network none --read-only --user 1000:1000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --pids-limit 64 --memory 1g --cpus 2 --log-driver none \
  --mount "type=volume,source=$source_volume,target=/snapshot,readonly,volume-nocopy" \
  --mount "type=volume,source=$dev_volume,target=/work,volume-nocopy" \
  --entrypoint /bin/sh "$image" -ec '
    test -f /snapshot/migration-manifest.json
    test -d /snapshot/ai-dev-sandbox-workspace/projects
    cp -R /snapshot/. /work/
    test -f /work/migration-manifest.json
    test -d /work/ai-dev-sandbox-workspace/projects
  ' || fail 'Copy failed. Existing destination is unapproved; do not reuse it.'

printf 'Verifying the copied 22,165 files independently...\n'
docker run --rm -i --pull never --platform linux/arm64 \
  --network none --read-only --user 1000:1000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --pids-limit 64 --memory 768m --cpus 2 --log-driver none \
  --mount "type=volume,source=$dev_volume,target=/restore,readonly,volume-nocopy" \
  --entrypoint python3 "$image" -I - < "$verifier" ||
  fail 'Independent clone verification failed; do not use that volume.'

printf 'Testing worker-shaped mounts without network, token or background process...\n'
docker run --rm --pull never --platform linux/arm64 \
  --network none --read-only --user 1000:1000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --pids-limit 64 --memory 768m --cpus 1 --log-driver none \
  --hostname ai-docker-sandbox \
  --mount "type=volume,source=$dev_volume,target=/workspace,volume-subpath=ai-dev-sandbox-workspace,volume-nocopy" \
  --mount "type=volume,source=$shadow_volume,target=/workspace/.auth,readonly,volume-nocopy" \
  --entrypoint /bin/sh "$image" -ec '
    test "$(id -u)" -eq 1000
    test "$(hostname)" = ai-docker-sandbox
    test -f /workspace/README.md
    test -d /workspace/projects
    test ! -S /var/run/docker.sock
    test -d /workspace/.auth
    test -z "$(ls -A /workspace/.auth)"
    awk '\''$5 == "/workspace/.auth" && $6 ~ /^ro,/ {found=1} END {exit !found}'\'' /proc/self/mountinfo
    test -d /workspace/experiments
    printf "mobile-offline-write-read-proof\n" > /workspace/experiments/podroid-offline-proof.txt
    test "$(cat /workspace/experiments/podroid-offline-proof.txt)" = mobile-offline-write-read-proof
    printf "PASS: independent writable /workspace, empty read-only auth shadow, offline write/read.\n"
  ' || fail 'Offline worker-shaped mount proof failed'

printf 'PASS: isolated Android offline-development volume prepared and verified.\n'
printf 'Working volume: %s\n' "$dev_volume"
printf 'Empty auth shadow: %s\n' "$shadow_volume"
printf 'Original staging volume preserved: %s\n' "$source_volume"
printf 'No ChatGPT worker, connector, authentication, or Windows supervisor changed.\n'
