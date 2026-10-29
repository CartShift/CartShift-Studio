#!/bin/sh
# Offline worker-identity probe for an audited candidate Python worker source.
# Does NOT run main(), poll Firestore, contact CartShift, or consume real tokens.
set -eu
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
image='sha256:3000817362f55553501261f8cbe0ff421a1cbdefb34b759073a5bd574ba836ee'
dev='podroid-workspace-dev-20261029-024634'
shadow='podroid-mobile-empty-auth-20261029-024634'
candidate='/mnt/downloads/ai-docker-sandbox-worker-candidate.py'
[ "$(uname -m)" = aarch64 ] || fail 'Expected ARM64 Podroid'
for volume in "$dev" "$shadow"; do
  docker volume inspect "$volume" >/dev/null || fail "Missing volume: $volume"
done
docker image inspect --platform linux/arm64 "$image" >/dev/null || fail 'Missing imported image'
if [ ! -f "$candidate" ]; then
  printf 'Fetching immutable-revision candidate source (NOT claiming host pin parity)...\n'
  wget -q -O "$candidate" \
    'https://raw.githubusercontent.com/CartShift/CartShift-Studio/d950643d06ed0fa4bf90ee95c88e388f1472bab5/scripts/ai-docker-sandbox-worker.py' ||
    fail 'Cannot download candidate Python worker source'
fi
[ -f "$candidate" ] && [ ! -L "$candidate" ] || fail 'Missing or unsafe candidate source'
printf 'Testing worker verify_identity() only, with a dummy string token and networking disabled...\n'
cat "$candidate" | docker run --rm -i --pull never --platform linux/arm64 \
  --network none --read-only --user 1000:1000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --hostname ai-docker-sandbox --pids-limit 64 --memory 768m --cpus 1 \
  --log-driver none -e PYTHONDONTWRITEBYTECODE=1 -e SANDBOX_WORKER_ROLE=build \
  --mount "type=volume,source=$dev,target=/workspace,volume-subpath=ai-dev-sandbox-workspace,readonly,volume-nocopy" \
  --mount "type=volume,source=$shadow,target=/workspace/.auth,readonly,volume-nocopy" \
  --entrypoint python3 "$image" -B -c '
import os, sys, types
source=sys.stdin.buffer.read()
assert len(source) > 1000 and len(source) < 256000
assert os.environ.get("SANDBOX_WORKER_ROLE") == "build"
m=types.ModuleType("offline_worker_candidate")
m.__file__="/dev/null"
exec(compile(source, m.__file__, "exec"), m.__dict__)
m.TOKEN="A"*32  # fake non-secret value, never sent anywhere
m.verify_identity()
print("PASS: candidate worker role/build identity verified offline.")
' || fail 'Offline worker role check failed'
printf 'No network, real tokens, background workers or host cutover were used.\n'
