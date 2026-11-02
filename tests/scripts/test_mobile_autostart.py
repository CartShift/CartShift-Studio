"""Exercise the real POSIX preflight with fixture metadata, never a Docker daemon."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[2]
SH=os.environ.get('TEST_POSIX_SH') or shutil.which('sh')

@unittest.skipUnless(SH,'POSIX shell required')
class AutostartTests(unittest.TestCase):
    def run_case(self, token='A'*48+'\n', token_mode='600', source_mode='644', config_mode='700', mismatch=False, owner='0', full=False, duplicate=False, armed=True, args=()):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);config=root/'config';config.mkdir()
            (config/'worker.token').write_bytes(token.encode())
            data=b'# fixture source\n';(config/'worker.py').write_bytes(data)
            digest=hashlib.sha256(data).hexdigest()
            (config/'worker.sha256').write_text('0'*64 if mismatch else digest)
            if armed:(config/'host-armed').touch()
            source=(ROOT/'scripts/mobile-sandbox/cartshift-mobile-worker-loop.sh').read_text()
            if not full:source=source.split('while [ -f "$ARMED_FILE" ]; do')[0]
            source=source.replace('CONFIG_DIR=/etc/cartshift-mobile',"CONFIG_DIR='"+config.as_posix()+"'")
            mocks='''
stat() {
  if [ "$2" = '%u' ]; then printf '%s\\n' "$OWNER_UID"; return; fi
  case "$3" in
    */worker.token) printf '%s\\n' "$TOKEN_MODE";;
    */worker.py|*/worker.sha256) printf '%s\\n' "$SOURCE_MODE";;
    */host-armed) printf '600\\n';;
    *) printf '%s\\n' "$CONFIG_MODE";;
  esac
}
docker() {
  printf '%s\\n' "$*" >> "$DOCKER_CALLS"
  if [ "$1 ${2:-}" = 'container inspect' ]; then [ "$DUPLICATE" = yes ]; return; fi
  if [ "$1" = run ]; then cat > "$STDIN_FILE"; fi
  return 0
}
sleep() { rm -f "$CONFIG_DIR/host-armed"; }
uname() { printf 'aarch64\\n'; }
sha256sum() { printf '%s  fixture\\n' "$ACTUAL_HASH"; }
'''
            script=root/'test.sh';script.write_bytes((mocks+'\n'+source+('' if full else '\npreflight\n')).encode())
            env=dict(os.environ,TOKEN_MODE=token_mode,SOURCE_MODE=source_mode,CONFIG_MODE=config_mode,ACTUAL_HASH=digest,DOCKER_CALLS=str(root/'docker-calls'),OWNER_UID=owner,DUPLICATE='yes' if duplicate else 'no',STDIN_FILE=str(root/'stdin'))
            env['PATH']=str(Path(SH).parent)+os.pathsep+env.get('PATH','')
            result=subprocess.run([SH,str(script),*args],env=env,capture_output=True,text=True,timeout=15)
            result.docker_calls=(root/'docker-calls').read_text() if (root/'docker-calls').exists() else ''
            result.delivered_stdin=(root/'stdin').read_text() if (root/'stdin').exists() else ''
            return result
    def test_valid_configuration(self):
        result=self.run_case();self.assertEqual(result.returncode,0,result.stderr)
    def test_multiline_or_invalid_bearer_is_rejected_without_disclosing_it(self):
        for token in ['A'*48+'\n'+'B'*48+'\n','invalid!\n'+'A'*48+'\n','short\n']:
            result=self.run_case(token=token)
            self.assertNotEqual(result.returncode,0)
            self.assertNotIn('A'*48,result.stderr)
    def test_group_writable_worker_or_config_is_rejected(self):
        for args in [dict(source_mode='666'),dict(config_mode='777')]:
            self.assertNotEqual(self.run_case(**args).returncode,0)
    def test_changed_source_or_world_readable_token_is_rejected(self):
        for args in [dict(mismatch=True),dict(token_mode='644')]:
            self.assertNotEqual(self.run_case(**args).returncode,0)
    def test_nonroot_configuration_is_rejected(self):self.assertNotEqual(self.run_case(owner='1000').returncode,0)
    def test_full_loop_refuses_existing_container(self):
        result=self.run_case(full=True,duplicate=True)
        self.assertNotIn('run --rm',result.docker_calls)
        self.assertEqual(result.delivered_stdin,'')
    def test_full_launch_uses_stdin_and_disarming_prevents_restart(self):
        result=self.run_case(full=True)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(result.delivered_stdin,'A'*48+'\n')
        self.assertNotIn('A'*48,result.docker_calls)
        self.assertEqual(result.docker_calls.count('run --rm'),1)
        for required in ['--user 1000:1000','--read-only','--cap-drop ALL','--memory-swap 1536m','--token-stdin','target=/workspace/.auth,readonly','SANDBOX_WORKER_ROLE=build']:
            self.assertIn(required,result.docker_calls)
    def test_disarmed_provisioning_check_never_launches_worker(self):
        result=self.run_case(full=True,armed=False,args=('--check-provisioning',))
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertNotIn('run --rm',result.docker_calls)
    def test_updater_rejects_membership_in_any_openrc_runlevel(self):
        source=(ROOT/'scripts/mobile-sandbox/podroid-provision-disarmed.sh').read_text()
        guard=source[source.index('levels='):source.index('docker info')]
        for membership,expected in [('default',1),('boot',1),('sysinit custom',1),('',0)]:
            script="fail() { exit 1; }; fake_rc_update() { case \"$2:$LEVELS\" in -v:*|*:default) printf 'cartshift-mobile-worker | %s\\n' \"$LEVELS\";; *) printf 'other-service | default\\n';; esac; };\n"+guard.replace('rc-update','fake_rc_update')
            env=dict(os.environ,LEVELS=membership)
            env['PATH']=str(Path(SH).parent)+os.pathsep+env.get('PATH','')
            result=subprocess.run([SH,'-c',script],env=env,capture_output=True)
            self.assertEqual(result.returncode,expected,membership)

if __name__=='__main__':unittest.main()
