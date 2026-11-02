#!/bin/sh
# Offline import of SHA256-verified image exported from owner's Windows Docker.
# Usage: sh podroid-import-image.sh IMAGE.tar DIGEST IMAGE_ID
set -eu
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
[ "$#" -eq 3 ] || fail "Usage: $0 IMAGE.tar 64_HEX_SHA256 sha256:64_HEX_IMAGE_ID"
archive="$1"
digest="$(printf '%s' "$2" | tr A-F a-f)"
image_id="$(printf '%s' "$3" | tr A-F a-f)"
case "$digest" in *[!0-9a-f]*|'') fail "Invalid SHA-256 digest" ;; esac
[ "${#digest}" -eq 64 ] || fail "Digest must have 64 hex characters"
case "$image_id" in sha256:*) ;; *) fail "Expected immutable sha256: image ID" ;; esac
image_hex="${image_id#sha256:}"
case "$image_hex" in *[!0-9a-f]*|'') fail "Invalid Docker image ID" ;; esac
[ "${#image_hex}" -eq 64 ] || fail "Image ID must have 64 hex characters"
[ -f "$archive" ] && [ ! -L "$archive" ] || fail "Missing archive or symlink"
case "$(uname -m)" in aarch64|arm64) ;; *) fail "Expected Podroid ARM64" ;; esac
command -v sha256sum >/dev/null 2>&1 || fail "sha256sum missing"
command -v docker >/dev/null 2>&1 || fail "Docker missing"
actual="$(sha256sum "$archive" | awk '{print $1}')"
[ "$actual" = "$digest" ] || fail "Archive SHA-256 mismatch: import refused"
printf 'Verified SHA-256. Loading image into local Podroid Docker...\n'
docker load -i "$archive"
docker image inspect "$image_id" >/dev/null 2>&1 || fail "Expected image ID absent"
arch="$(docker image inspect "$image_id" --format '{{.Architecture}}')"
case "$arch" in arm64|aarch64) ;; *) fail "Image architecture mismatch: $arch" ;; esac
printf 'PASS: exact ARM64 image %s imported.\n' "$image_id"
printf 'No worker started and no credentials/volumes restored.\n'
