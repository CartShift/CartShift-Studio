"""Exercise host snapshot payloads against synthetic, credential-free files."""
import hashlib
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[2] / "scripts/sandbox-host/Prepare-SandboxAuthIsolation.ps1"


class SnapshotBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.source = self.root / "source"
        self.output = self.root / "output"
        self.auth = self.root / "auth"
        (self.source / "scripts").mkdir(parents=True)
        (self.source / ".auth/provider").mkdir(parents=True)
        (self.source / ".auth/provider/synthetic").write_text("fixture-only")
        (self.source / "scripts/devctl").write_text("#!/bin/sh\nexit 0\n")
        (self.source / "scripts/devctl").chmod(0o700)
        package = self.source / "toolchain/node_modules/package/bin"
        package.mkdir(parents=True)
        (package / "cli.js").write_text("console.log('synthetic');")
        bins = self.source / "toolchain/node_modules/.bin"
        bins.mkdir()
        (bins / "cli").symlink_to("../package/bin/cli.js")
        text = SCRIPT.read_text()
        self.snapshot = re.search(r"\$snapshot=@'\n(.*?)\n'@", text, re.S).group(1)
        self.verify = re.search(r"\$validate=@'\n(.*?)\n'@", text, re.S).group(1)
        self.snapshot = self.snapshot.replace("pathlib.Path('/workspace')", repr(self.source))
        # Replace repr(PosixPath) with a plain pathlib.Path expression.
        self.snapshot = self.snapshot.replace(repr(self.source), "pathlib.Path(%r)" % str(self.source))
        self.snapshot = self.snapshot.replace("pathlib.Path('/out')", "pathlib.Path(%r)" % str(self.output))
        self.snapshot = self.snapshot.replace("pathlib.Path('/auth')", "pathlib.Path(%r)" % str(self.auth))
        self.verify = self.verify.replace("pathlib.Path('/workspace')", "pathlib.Path(%r)" % str(self.output))

    def run_snapshot(self):
        return subprocess.run([sys.executable, "-I", "-c", self.snapshot], capture_output=True, text=True)

    def run_verify(self):
        raw = (self.output / "scripts/.sandbox-tools-manifest.json").read_bytes()
        return subprocess.run([sys.executable, "-I", "-c", self.verify, hashlib.sha256(raw).hexdigest()], capture_output=True, text=True)

    def test_legitimate_relative_package_link_survives_and_verifies(self):
        self.assertEqual(self.run_snapshot().returncode, 0)
        self.assertEqual(self.run_verify().returncode, 0)
        self.assertTrue((self.output / "toolchain/node_modules/.bin/cli").is_symlink())
        self.assertTrue((self.auth / "provider/synthetic").is_file())

    def test_tool_link_into_writable_auth_is_rejected(self):
        (self.source / "toolchain/escape").symlink_to(self.source / ".auth/provider/synthetic")
        self.assertNotEqual(self.run_snapshot().returncode, 0)
        self.assertFalse(self.output.exists())

    def test_credential_link_outside_credential_root_is_rejected(self):
        (self.source / ".auth/escape").symlink_to(self.source / "scripts/devctl")
        self.assertNotEqual(self.run_snapshot().returncode, 0)

    def test_modified_snapshot_code_is_rejected(self):
        self.assertEqual(self.run_snapshot().returncode, 0)
        (self.output / "scripts/devctl").write_text("modified")
        self.assertNotEqual(self.run_verify().returncode, 0)


if __name__ == "__main__":
    unittest.main()
