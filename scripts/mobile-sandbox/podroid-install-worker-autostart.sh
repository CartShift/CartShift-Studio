#!/bin/sh
# One-time Podroid OpenRC installation. Creates DISARMED boot service only.
# Must not start any network worker or create credentials.
set -eu
[ "$(id -u)" = 0 ] || { echo 'Run as root inside Podroid' >&2; exit 1; }
[ "$(uname -m)" = aarch64 ] || { echo 'ARM64 Podroid required' >&2; exit 1; }
for path in /etc/init.d/cartshift-mobile-worker /usr/local/sbin/cartshift-mobile-worker-loop; do
  [ ! -e "$path" ] || { echo 'Already installed; refusing overwrite' >&2; exit 1; }
done
PIN='434b9ab46674cac1d67d76bc9be32c875c707a24'
ROOT="https://raw.githubusercontent.com/CartShift/CartShift-Studio/$PIN/scripts/mobile-sandbox"
temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT HUP INT TERM
wget -q -O "$temp/loop.sh" "$ROOT/cartshift-mobile-worker-loop.sh"
wget -q -O "$temp/service" "$ROOT/cartshift-mobile-worker.initd"
sh -n "$temp/loop.sh" "$temp/service"
# Minimal Podroid/Alpine images may omit this standard optional path.
# Create the expected parent BEFORE installing the worker launcher.
install -d -m 755 /usr/local/sbin
install -d -m 700 /etc/cartshift-mobile
install -m 700 "$temp/loop.sh" /usr/local/sbin/cartshift-mobile-worker-loop
install -m 755 "$temp/service" /etc/init.d/cartshift-mobile-worker
printf 'PASS: OpenRC service INSTALLED but NOT ARMED or ENABLED.\n'
printf 'It will not start until explicit fenced host switch, distinct bearer, owner-pinned worker source and the one-time rc-update enable.\n'
printf 'No real worker, token, connector or Windows host was changed.\n'
