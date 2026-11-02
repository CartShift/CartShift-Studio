#!/bin/sh
# Podroid OpenRC runner: no token in Docker environment, mounts or arguments.
set -eu
umask 077
CONFIG_DIR=/etc/cartshift-mobile
TOKEN_FILE="$CONFIG_DIR/worker.token"
SCRIPT_FILE="$CONFIG_DIR/worker.py"
HASH_FILE="$CONFIG_DIR/worker.sha256"
ARMED_FILE="$CONFIG_DIR/host-armed"
IMAGE='sha256:3000817362f55553501261f8cbe0ff421a1cbdefb34b759073a5bd574ba836ee'
DEV='podroid-workspace-dev-20261029-024634'
SHADOW='podroid-mobile-empty-auth-20261029-024634'
NAME='cartshift-mobile-worker'
fail() { printf 'cartshift-mobile-worker: %s\n' "$*" >&2; }
# The local arm marker is not a substitute for backend Windows fencing.
preflight() {
  [ -d "$CONFIG_DIR" ] && [ ! -L "$CONFIG_DIR" ] &&
    [ "$(stat -c '%u' "$CONFIG_DIR")" = 0 ] &&
    [ "$(stat -c '%a' "$CONFIG_DIR")" = 700 ] ||
    { fail 'configuration directory must be root-owned 0700'; return 1; }
  if [ "${1:-armed}" != provisioning ]; then
    [ -f "$ARMED_FILE" ] && [ ! -L "$ARMED_FILE" ] &&
      [ "$(stat -c '%u' "$ARMED_FILE")" = 0 ] &&
      [ "$(stat -c '%a' "$ARMED_FILE")" = 600 ] ||
      { fail 'host not securely armed'; return 1; }
  fi
  for path in "$TOKEN_FILE" "$SCRIPT_FILE" "$HASH_FILE"; do
    [ -f "$path" ] && [ ! -L "$path" ] || { fail 'missing provisioning file'; return 1; }
  done
  [ "$(stat -c '%a' "$TOKEN_FILE")" = 600 ] || { fail 'bearer must be 0600'; return 1; }
  [ "$(stat -c '%u' "$TOKEN_FILE")" = 0 ] || { fail 'bearer must be root-owned'; return 1; }
  for path in "$SCRIPT_FILE" "$HASH_FILE"; do
    [ "$(stat -c '%u' "$path")" = 0 ] && [ "$(stat -c '%a' "$path")" = 644 ] ||
      { fail 'source and pin must be root-owned 0644'; return 1; }
  done
  LC_ALL=C awk 'NR != 1 || $0 !~ /^[A-Za-z0-9_-]+$/ || length($0) < 32 || length($0) > 128 { bad=1 } END { exit(bad || NR != 1) }' "$TOKEN_FILE" ||
    { fail 'invalid bearer encoding'; return 1; }
  expected="$(cat "$HASH_FILE")"
  case "$expected" in *[!0-9a-f]*|'') fail 'invalid worker source pin'; return 1;; esac
  [ "$(printf %s "$expected" | wc -c)" -eq 64 ] ||
    { fail 'wrong pin length'; return 1; }
  actual="$(sha256sum "$SCRIPT_FILE" | awk '{print $1}')"
  [ "$expected" = "$actual" ] ||
    { fail 'worker source does not match owner pin'; return 1; }
  docker info >/dev/null 2>&1 || { fail 'Docker unavailable'; return 1; }
  docker image inspect --platform linux/arm64 "$IMAGE" >/dev/null 2>&1 ||
    { fail 'exact imported image missing'; return 1; }
  docker volume inspect "$DEV" >/dev/null 2>&1 ||
    { fail 'development volume missing'; return 1; }
  docker volume inspect "$SHADOW" >/dev/null 2>&1 ||
    { fail 'empty auth shadow missing'; return 1; }
  [ "$(uname -m)" = aarch64 ] || { fail 'wrong architecture'; return 1; }
}
case "${1:-run}" in
  --check-provisioning) preflight provisioning; exit $?;;
  run) :;;
  *) fail 'unknown option'; exit 1;;
esac
while [ -f "$ARMED_FILE" ]; do
  if preflight; then
    if docker container inspect "$NAME" >/dev/null 2>&1; then
      fail 'reserved container already exists; refusing duplicate'
    else
      # stdin-only credential, consumed by Python before work starts.
      cat "$TOKEN_FILE" | docker run --rm -i --pull never --platform linux/arm64 \
        --name "$NAME" --hostname ai-docker-sandbox \
        --user 1000:1000 --read-only \
        --network bridge --cap-drop ALL --security-opt no-new-privileges:true \
        --pids-limit 128 --memory 1536m --memory-swap 1536m --cpus 2 \
        --tmpfs /tmp:rw,nosuid,nodev,noexec,size=64m,mode=1777 \
        --tmpfs /home/node:rw,nosuid,nodev,noexec,size=256m,uid=1000,gid=1000,mode=0700 \
        --log-driver json-file --log-opt max-size=2m --log-opt max-file=2 \
        --mount "type=volume,source=$DEV,target=/workspace,volume-subpath=ai-dev-sandbox-workspace,volume-nocopy" \
        --mount "type=volume,source=$SHADOW,target=/workspace/.auth,readonly,volume-nocopy" \
        --mount "type=bind,source=$SCRIPT_FILE,target=/opt/cartshift-mobile-worker.py,readonly" \
        --env SANDBOX_WORKER_ROLE=build \
        --entrypoint python3 "$IMAGE" -I -B /opt/cartshift-mobile-worker.py --token-stdin ||
        fail 'worker exited; will recheck conditions before retry'
    fi
  fi
  sleep 15
done
fail 'host disarmed; loop ended'
