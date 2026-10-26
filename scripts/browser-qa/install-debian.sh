#!/bin/sh
# Run only as root INSIDE the existing restricted Debian ARM64 Docker sandbox.
# Installation is idempotent; it never touches the Docker socket or host.
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run as root in the Docker container, not as the sandbox worker user." >&2
  echo "Owner host: docker exec --user root ai-dev-workspace sh /workspace/projects/cart-shift-studio/scripts/browser-qa/install-debian.sh" >&2
  exit 1
fi

if [ ! -e /etc/debian_version ] || ! command -v apt-get >/dev/null 2>&1; then
  echo "ERROR: this installer is for Debian ARM64 only. Do not change the sandbox base image blindly." >&2
  exit 1
fi

ARCH="$(dpkg --print-architecture)"
if [ "$ARCH" != "arm64" ]; then
  echo "ERROR: expected arm64 Docker architecture; found $ARCH." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  chromium fonts-noto-core fonts-noto-color-emoji ca-certificates
apt-get clean
rm -rf /var/lib/apt/lists/*

test -x /usr/bin/chromium
/usr/bin/chromium --version
echo "Native Debian arm64 Chromium installed. Verify with the unprivileged worker:"
echo "  cd /workspace/projects/cart-shift-studio && node scripts/browser-qa/verify.mjs"
