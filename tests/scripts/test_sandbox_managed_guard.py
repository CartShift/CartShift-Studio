"""Run the exact immutable pre-exec managed-project guard on private fixtures."""
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest

class ManagedProjectGuardTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root=pathlib.Path(self.tmp.name); self.info=self.root/'mountinfo'; self.flag=self.root/'verified'
        source=(pathlib.Path(__file__).resolve().parents[2]/'scripts/sandbox-host/Manage-SandboxDevService.ps1').read_text()
        self.program=re.search(r"\$mountGuard = '([^']+)'",source).group(1)
        self.program=self.program.replace('"/proc/self/mountinfo"',repr(str(self.info))).replace('"/tmp/cartshift-project-mount-verified"',repr(str(self.flag)))
        self.expected='/data/docker/volumes/workspace/_data/projects/proof'
    def invoke(self,root,mountpoint='/app',extra=''):
        self.info.write_text(f'41 1 0:42 {root} {mountpoint} rw - ext4 /dev/sda rw\n'+extra)
        return subprocess.run([sys.executable,'-I','-c',self.program,self.expected],capture_output=True)
    def test_exact_project_mount_authorizes_execution(self):
        self.assertEqual(self.invoke(self.expected).returncode,0); self.assertEqual(self.flag.read_text(),'v1')
    def test_credential_symlink_target_is_rejected_before_ready(self):
        self.assertNotEqual(self.invoke('/data/docker/volumes/workspace/_data/.auth').returncode,0); self.assertFalse(self.flag.exists())
    def test_suffix_spoof_is_rejected(self):
        self.assertNotEqual(self.invoke('/untrusted'+self.expected).returncode,0); self.assertFalse(self.flag.exists())
    def test_wrong_or_duplicate_mountpoint_is_rejected(self):
        self.assertNotEqual(self.invoke(self.expected,'/app-other').returncode,0)
        self.assertNotEqual(self.invoke(self.expected,extra=f'42 1 0:42 {self.expected} /app rw - ext4 /dev/sda rw\n').returncode,0)
        self.assertFalse(self.flag.exists())

if __name__=='__main__': unittest.main()