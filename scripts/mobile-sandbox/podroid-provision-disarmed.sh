#!/bin/sh
# Install a reviewed provisioning bundle only while the existing service is off.
# Never arm, enable, start, contact the queue, or print a bearer.
set -eu
umask 077
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || fail 'Run as root inside Podroid'
[ "$(uname -m)" = aarch64 ] || fail 'Expected ARM64 Podroid'
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$HERE"
sha256sum -c PROVISIONING-SHA256SUMS >/dev/null || fail 'Provisioning bundle checksum mismatch'
CONFIG=/etc/cartshift-mobile
[ -d "$CONFIG" ] && [ ! -L "$CONFIG" ] &&
  [ "$(stat -c '%u:%a' "$CONFIG")" = 0:700 ] || fail 'Expected root-owned 0700 configuration directory'
[ ! -e "$CONFIG/host-armed" ] && [ ! -L "$CONFIG/host-armed" ] || fail 'Host is armed'
if rc-service cartshift-mobile-worker status >/dev/null 2>&1; then fail 'Service must be stopped'; fi
levels=$(rc-update show -v) || fail 'Cannot inspect OpenRC runlevels'
if printf '%s\n' "$levels" | awk '$1 == "cartshift-mobile-worker" && NF > 2 { enabled=1 } END { exit(!enabled) }'; then
  fail 'Service must remain disabled in every runlevel'
fi
docker info >/dev/null 2>&1 || fail 'Docker unavailable; cannot prove reserved container absent'
if docker container inspect cartshift-mobile-worker >/dev/null 2>&1; then fail 'Reserved container exists; review it before provisioning'; fi
# Check the exact previously installed unit/loop before replacing either.
sha256sum -c INSTALLED-SHA256SUMS >/dev/null || fail 'Existing service differs from reviewed installed revision'
for name in worker.py worker.sha256 worker.token; do
  [ ! -e "$CONFIG/$name" ] && [ ! -L "$CONFIG/$name" ] || fail 'Provisioning file already exists; no overwrite'
done
for name in worker.py worker.sha256 worker.token cartshift-mobile-worker-loop.sh cartshift-mobile-worker.initd; do
  [ -f "$name" ] && [ ! -L "$name" ] || fail 'Unsafe staged provisioning file'
done
sh -n cartshift-mobile-worker-loop.sh cartshift-mobile-worker.initd
# Keep installed boot infrastructure recoverable; this directory is root-only.
[ ! -e previous-loop.sh ] && [ ! -e previous-service.initd ] || fail 'Prior backup exists'
cp -p /usr/local/sbin/cartshift-mobile-worker-loop previous-loop.sh
cp -p /etc/init.d/cartshift-mobile-worker previous-service.initd
install -m 0644 worker.py "$CONFIG/worker.py"
install -m 0644 worker.sha256 "$CONFIG/worker.sha256"
install -m 0600 worker.token "$CONFIG/worker.token"
install -m 0700 cartshift-mobile-worker-loop.sh /usr/local/sbin/cartshift-mobile-worker-loop
install -m 0755 cartshift-mobile-worker.initd /etc/init.d/cartshift-mobile-worker
/usr/local/sbin/cartshift-mobile-worker-loop --check-provisioning
printf 'PASS: provisioned and checked; service remains DISARMED and DISABLED.\n'
