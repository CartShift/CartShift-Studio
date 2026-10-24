"""Exercise fixed host maintenance payload on synthetic /tmp roots only."""
import os
import pathlib
import re
import subprocess
import sys
import tempfile
import time
import unittest

HOST = pathlib.Path(__file__).resolve().parents[2] / "scripts/sandbox-host"


class BackupBarrierTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.nonce = "a" * 32
        self.payload = (self.nonce + "\n").encode()
        text = (HOST / "Common-SandboxBackupBarrier.ps1").read_text()
        self.program = re.search(r"\$script:SandboxBackupMarkerPython=@'\n(.*?)\n'@", text, re.S).group(1)
        self.program = self.program.replace("os.open('/tmp',", "os.open(%r," % str(self.root))

    def invoke(self, operation, nonce=None, roles="build,auth"):
        return subprocess.run([sys.executable, "-I", "-c", self.program, operation, nonce or self.nonce, roles], capture_output=True, text=True)

    def marker(self, name, data=None, mode=0o600):
        path = self.root / name
        path.write_bytes(self.payload if data is None else data)
        path.chmod(mode)
        return path

    def test_request_is_complete_regular_single_link_and_private(self):
        self.assertEqual(self.invoke("request").returncode, 0)
        path = self.root / "cartshift-backup-request"
        self.assertEqual(path.read_bytes(), self.payload)
        self.assertEqual(path.stat().st_mode & 0o777, 0o600)
        self.assertEqual(path.stat().st_nlink, 1)
        self.assertFalse(list(self.root.glob("*.pending")))

    def test_atomic_request_never_overwrites_an_existing_lease(self):
        path = self.marker("cartshift-backup-request", b"b" * 32 + b"\n")
        self.assertNotEqual(self.invoke("request").returncode, 0)
        self.assertEqual(path.read_bytes(), b"b" * 32 + b"\n")
        self.assertFalse(list(self.root.glob("*.pending")))

    def test_legacy_requires_both_channels_and_partial_ready_is_pending(self):
        self.assertEqual(self.invoke("request").returncode, 0)
        self.marker("cartshift-backup-build-ready")
        self.assertEqual(self.invoke("check").stdout.strip(), "waiting")
        self.marker("cartshift-backup-auth-ready", b"a" * 5)
        self.assertEqual(self.invoke("check").stdout.strip(), "waiting")
        self.marker("cartshift-backup-auth-ready")
        self.assertEqual(self.invoke("check").stdout.strip(), "ready")

    def test_auth_sidecar_needs_only_auth_acknowledgement(self):
        self.assertEqual(self.invoke("request", roles="auth").returncode, 0)
        self.marker("cartshift-backup-auth-ready")
        self.assertEqual(self.invoke("check", roles="auth").stdout.strip(), "ready")

    def test_old_worker_has_no_acknowledgements_and_is_never_ready(self):
        self.assertEqual(self.invoke("request").returncode, 0)
        self.assertEqual(self.invoke("check").stdout.strip(), "waiting")
        self.assertEqual(self.invoke("cleanup").returncode, 0)
        self.assertFalse((self.root / "cartshift-backup-request").exists())

    def test_cleanup_preserves_other_nonce_and_never_follows_symlink(self):
        request = self.marker("cartshift-backup-request", b"b" * 32 + b"\n")
        target = self.marker("outside", b"synthetic-target")
        (self.root / "cartshift-backup-build-ready").symlink_to(target)
        self.assertNotEqual(self.invoke("cleanup").returncode, 0)
        self.assertEqual(request.read_bytes(), b"b" * 32 + b"\n")
        self.assertEqual(target.read_bytes(), b"synthetic-target")

    def test_stale_request_and_hardlinked_ack_are_rejected(self):
        self.assertEqual(self.invoke("request").returncode, 0)
        request = self.root / "cartshift-backup-request"
        os.utime(request, (time.time() - 3601, time.time() - 3601))
        self.assertNotEqual(self.invoke("check").returncode, 0)
        os.utime(request, None)
        ack = self.marker("cartshift-backup-build-ready")
        os.link(ack, self.root / "second-link")
        self.assertNotEqual(self.invoke("check").returncode, 0)

    def test_successful_cleanup_removes_only_matching_markers(self):
        self.assertEqual(self.invoke("request").returncode, 0)
        self.marker("cartshift-backup-build-ready")
        other = self.marker("cartshift-backup-auth-ready", b"b" * 32 + b"\n")
        self.assertEqual(self.invoke("cleanup").returncode, 0)
        self.assertFalse((self.root / "cartshift-backup-request").exists())
        self.assertFalse((self.root / "cartshift-backup-build-ready").exists())
        self.assertTrue(other.exists())

    def test_leases_are_private_local_state_and_json_never_selects_executable(self):
        backup = (HOST / "Backup-Sandbox.ps1").read_text()
        helper = (HOST / "Common-SandboxBackupBarrier.ps1").read_text()
        watchdog = (HOST / "Watch-SandboxBackupPause.ps1").read_text()
        self.assertNotIn("$leaseFile=Join-Path $BackupDir", backup)
        self.assertIn("$leaseDirectory=Get-SandboxBackupLeaseDirectory -Create", backup)
        self.assertIn("Assert-SandboxBackupLeasePath $leaseFile", backup)
        self.assertIn("UserProfile", helper)
        self.assertIn(".cartshift-sandbox", helper)
        self.assertIn("Backup state permits access beyond the owner and SYSTEM.", helper)
        self.assertIn('Common-SandboxHost.ps1', watchdog)
        self.assertIn("$trustedDocker", watchdog)
        self.assertNotIn("$script:SandboxDockerExe=$lease.docker", watchdog)
        self.assertNotIn("& $lease.docker", watchdog)

    def test_host_requires_ack_before_pause_and_stops_expired_certification(self):
        backup = (HOST / "Backup-Sandbox.ps1").read_text()
        watchdog = (HOST / "Watch-SandboxBackupPause.ps1").read_text()
        self.assertNotIn("$idleCheck", backup)
        self.assertIn("$wait.Elapsed.TotalSeconds -ge 60", backup)
        self.assertLess(backup.index("$wait=[Diagnostics.Stopwatch]"), backup.index("@('pause',$id)"))
        self.assertLess(backup.index("request $barrier.nonce"), backup.index("@('pause',$id)"))
        self.assertLess(backup.index("Enter-SandboxBackupLeaseMutex $leaseMutex", backup.index("Pipe $producer $consumer")), backup.index("Move-Item -LiteralPath $partial"))
        self.assertIn("Invoke-SandboxBackupMarker $id cleanup", watchdog)
        self.assertIn("($LeaseFile+'.abort')", watchdog)


if __name__ == "__main__":
    unittest.main()
