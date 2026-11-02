"""Source-level guardrails for the optional Remote Desktop Commander sidecar.

These tests catch accidental widening of container privileges/mounts and keep
backup integration visible. Real Docker/Android acceptance is a separate gate.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
SIDECAR = ROOT / "scripts/sandbox-host/Manage-SandboxDesktopCommander.ps1"
BACKUP = ROOT / "scripts/sandbox-host/Backup-Sandbox.ps1"


class RemoteDesktopCommanderBoundaryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sidecar = SIDECAR.read_text(encoding="utf-8")
        cls.backup = BACKUP.read_text(encoding="utf-8")

    def test_operator_approval_gates_creation_and_start(self):
        self.assertIn("if (!$AcknowledgeThirdPartyRelay)", self.sidecar)
        self.assertIn("if ($Action -eq 'Start')", self.sidecar)
        self.assertGreaterEqual(self.sidecar.count("!$AcknowledgeThirdPartyRelay"), 2)

    def test_no_host_mount_ports_or_privileged_container(self):
        self.assertIn("--cap-drop ALL", self.sidecar)
        self.assertIn("--security-opt no-new-privileges", self.sidecar)
        self.assertIn("--read-only", self.sidecar)
        self.assertIn("--user 1000:1000", self.sidecar)
        self.assertIn("--pids-limit 128", self.sidecar)
        self.assertIn("--memory 1g --memory-swap 1g", self.sidecar)
        self.assertNotRegex(self.sidecar, r"--privileged|--publish\b|--network\s+host")
        self.assertNotIn("docker.sock", self.sidecar.split("Invoke-SandboxDocker create", 1)[-1])

    def test_credential_shadow_and_independent_home(self):
        self.assertIn("target=/workspace/.auth,readonly,volume-nocopy", self.sidecar)
        self.assertIn("target=/home/node", self.sidecar)
        self.assertIn("Assert-SandboxMount $spec '/workspace/.auth' $CredentialShadow $false", self.sidecar)
        self.assertIn("os.chmod(p,0o700)", self.sidecar)
        self.assertEqual(self.sidecar.count("target=/home/node,volume-nocopy"), 3)
        self.assertIn("Refusing to replace or reuse pairing state.", self.sidecar)

    def test_uses_pinned_existing_package_only(self):
        self.assertIn("/opt/dc/node_modules/@wonderwhy-er/desktop-commander/dist/index.js", self.sidecar)
        self.assertIn("--entrypoint python3 $source.image -I -c 'import os; assert os.path.isfile(", self.sidecar)
        for forbidden in ("npm install", "npx @", "curl ", "iex ", "Invoke-Expression"):
            self.assertNotIn(forbidden, self.sidecar)

    def test_backup_includes_pairing_home_and_freezes_verified_sidecar(self):
        self.assertIn("'ai-dev-sandbox-dc-remote-home'", self.backup)
        self.assertIn("io.cartshift.sandbox.dc-role", self.backup)
        self.assertIn("Refusing to pause unverified writer.", self.backup)
        self.assertIn("crash-consistent", self.backup)

    def test_preparation_helpers_bypass_workspace_initialization(self):
        helpers = [line for line in self.sidecar.splitlines() if 'Invoke-SandboxDocker run --rm' in line]
        self.assertEqual(len(helpers), 3)
        for line in helpers:
            self.assertIn('--entrypoint python3', line)
            self.assertIn('--network none', line)
        # WhatIf must not start even a temporary container.
        gate = self.sidecar.index("if ($PSCmdlet.ShouldProcess($Name,'Create isolated")
        self.assertGreater(self.sidecar.index(helpers[0]), gate)

    def test_private_mode_is_set_before_dropping_directory_ownership(self):
        self.assertLess(self.sidecar.index('os.chmod(p,0o700)'), self.sidecar.index('os.chown(p,1000,1000)'))

    def test_resume_requires_empty_private_owned_home_and_no_consumers(self):
        self.assertIn('[switch]$ResumeEmptyHome', self.sidecar)
        self.assertIn('Assert-SandboxVolumeQuiescent $homeVolume', self.sidecar)
        self.assertIn('assert os.listdir(p)==[]', self.sidecar)
        self.assertIn('st.st_uid==1000', self.sidecar)
        self.assertIn('st.st_mode & 0o777==0o700', self.sidecar)

    def test_no_destructive_reset_operation(self):
        self.assertIn("'Prepare','Verify','Start','Stop','Logs'", self.sidecar)
        self.assertNotRegex(self.sidecar, r"Invoke-SandboxDocker\s+(?:rm|rmi|volume\s+rm)\b")


if __name__ == "__main__":
    unittest.main()
