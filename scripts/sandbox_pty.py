"""Private, fixed-command OAuth PTY guardian. No credentials or terminal spool on disk."""
from __future__ import annotations
import codecs
import ctypes
import fcntl
import json
import os
import pathlib
import pty
import re
import select
import signal
import socket
import struct
import subprocess
import termios
import threading
import time

PROVIDERS = frozenset(('supabase', 'github', 'vercel', 'firebase', 'shopify', 'northflank', 'apps-script'))
TERMINAL = frozenset(('completed', 'failed', 'stopped', 'expired'))
UNSET = object()
MAX_OUTPUT = 24000
MAX_FLOOD = 2000000
META = pathlib.Path('/tmp/cartshift-auth-guardian')
ANSI = re.compile(r'\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|\x1b\\))')
SECRET = re.compile(r'(?:gh[pousr]_[A-Za-z0-9_-]+|github_pat_[A-Za-z0-9_-]+|sbp_[A-Za-z0-9_]+|sb_secret_[A-Za-z0-9_-]+|shp(?:at|ca|pa|ss)_[A-Za-z0-9_-]+|vcp_[A-Za-z0-9_-]+|vercel_[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?|4/[A-Za-z0-9._~-]+)', re.I)

def valid_input(provider, kind, value):
    if not isinstance(value, str) or len(value) > 512 or any(ord(c) < 32 or ord(c) == 127 for c in value):
        return False
    if provider in ('firebase', 'apps-script') and kind == 'verification_code' and value.startswith('4/') and SECRET.search(value[2:]):
        return False
    if SECRET.search(value) and not (provider in ('firebase', 'apps-script') and kind == 'verification_code' and re.fullmatch(r'4/[A-Za-z0-9._~-]+', value)):
        return False
    if kind == 'confirm':
        return value.lower() in ('', 'y', 'yes', 'n', 'no')
    return kind == 'verification_code' and ((provider == 'supabase' and re.fullmatch(r'[a-fA-F0-9]{8}', value) is not None) or (provider in ('firebase', 'apps-script') and re.fullmatch(r'4/[A-Za-z0-9._~-]+', value) is not None))

def ticks(pid):
    try:
        return pathlib.Path(f'/proc/{pid}/stat').read_text().rsplit(')', 1)[1].split()[19]
    except (OSError, IndexError):
        return None

def children():
    return {int(p) for p in pathlib.Path(f'/proc/self/task/{os.getpid()}/children').read_text().split()}

def reap_all():
    deadline = time.monotonic() + 2
    while time.monotonic() < deadline:
        found = children()
        if not found:
            return
        for pid in found:
            try: os.kill(pid, signal.SIGKILL)
            except ProcessLookupError: pass
        for pid in found:
            try: os.waitpid(pid, os.WNOHANG)
            except ChildProcessError: pass
        time.sleep(.01)
    if children():
        pathlib.Path('/tmp/cartshift-worker-unsafe').touch(mode=0o600)
        raise RuntimeError('Guardian cleanup failed')

def recovery_tree(entries):
    # Discover still-attached descendants before killing recorded parents. This
    # narrows the snapshot gap; already-reparented, unrecorded children require
    # container/cgroup cleanup and cannot be inferred safely from PID alone.
    found = {entry['pid']: entry['ticks'] for entry in entries}
    pending = list(found)
    while pending:
        pid = pending.pop()
        expected = found[pid]
        if ticks(pid) != expected: continue
        try:
            descendants = pathlib.Path(f'/proc/{pid}/task/{pid}/children').read_text().split()
            for child in descendants:
                child = int(child)
                fields = pathlib.Path(f'/proc/{child}/stat').read_text().rsplit(')', 1)[1].split()
                if int(fields[1]) != pid or ticks(pid) != expected: continue
                if child not in found:
                    found[child] = fields[19]
                    pending.append(child)
        except (OSError, ValueError, IndexError):
            pass
    return found

def recover():
    META.mkdir(mode=0o700, exist_ok=True)
    if META.is_symlink() or META.stat().st_uid != os.getuid():
        raise RuntimeError('Unsafe guardian metadata')
    os.chmod(META, 0o700)
    for path in META.glob('*.json'):
        if path.is_symlink() or path.stat().st_uid != os.getuid():
            raise RuntimeError('Unsafe guardian record')
        record = json.loads(path.read_text())
        guardian = record['guardian']
        if ticks(guardian) == record['guardian_ticks']:
            raise RuntimeError('Another guardian is alive')
        for pid, expected in reversed(list(recovery_tree(record['children']).items())):
            if ticks(pid) == expected:
                try: os.kill(pid, signal.SIGKILL)
                except ProcessLookupError: pass
        path.unlink()

class Redactor:
    """Only publish complete lexical units so secrets split across reads never leak."""
    def __init__(self):
        self.pending = ''
        self.dropping = False
        self.decoder = codecs.getincrementaldecoder('utf-8')('replace')
        self.values = []
        self.sensitive_next = False
        self.pem = False
        self.pem_ending = False
    def feed(self, data, final=False):
        self.pending += self.decoder.decode(data, final=final)
        # Keep incomplete ANSI escapes private too.
        text = ANSI.sub('', self.pending)
        text = ''.join(c for c in text if ord(c) >= 32 or c in '\n\r\t\x1b')
        boundary = len(text) if final else max((m.end() for m in re.finditer(r'\s', text)), default=0)
        out, self.pending = text[:boundary], text[boundary:]
        if self.dropping:
            cut = re.search(r'\s', out)
            out = out[cut.end():] if cut else ''
            if cut: self.dropping = False
        if len(self.pending) > 4096:
            self.pending = ''
            self.dropping = True
        out = re.sub(r'\x1b[^\s]*', '', out)
        # Carry labelled-secret context across separate reads/whitespace.
        units = re.split(r'(\s+)', out)
        for index, unit in enumerate(units):
            if unit.startswith('-----BEGIN'):
                self.pem = True
                units[index] = '[REDACTED]'
                continue
            if self.pem:
                units[index] = ''
                if '-----END' in unit: self.pem_ending = True
                elif self.pem_ending and unit.endswith('-----'):
                    self.pem = self.pem_ending = False
                continue
            if not unit or unit.isspace(): continue
            if self.sensitive_next:
                units[index] = '[REDACTED]'
                self.sensitive_next = unit.lower() == 'bearer'
            elif re.fullmatch(r'(?i)(?:access_token|refresh_token|id_token|password|authorization|client_secret|api_key|firebase_token|bearer)[:=]?', unit.strip('{}[],').replace(chr(34), '').replace(chr(39), '')):
                self.sensitive_next = True
        out = ''.join(units)
        out = SECRET.sub('[REDACTED]', out)
        out = re.sub(r"(?i)([\"']?(?:access_token|refresh_token|id_token|password|authorization|client_secret|api_key|firebase_token|bearer)[\"']?\s*[:=]\s*[\"']?)[^\"'\s&,}]+", r'\1[REDACTED]', out)
        for value in self.values:
            out = out.replace(value, '[REDACTED]')
        return out

class TerminalQueries:
    """Answer only bounded cursor-position requests from the local CLI."""
    def __init__(self):
        self.pending = bytearray()
        self.row, self.column = 1, 1
        self.responses = 0
    def feed(self, data):
        replies = bytearray()
        for value in data:
            if value == 27:
                self.pending = bytearray((27,))
                continue
            if not self.pending:
                continue
            if len(self.pending) == 1:
                if value == 91: self.pending.append(value)
                else: self.pending.clear()
                continue
            self.pending.append(value)
            if len(self.pending) > 64:
                self.pending.clear()
                continue
            if 64 <= value <= 126:
                sequence = bytes(self.pending)
                self.pending.clear()
                position = re.fullmatch(rb'\x1b\[([0-9]*)(?:;([0-9]*))?[Hf]', sequence)
                if position:
                    self.row = min(30, max(1, int(position[1] or b'1')))
                    self.column = min(120, max(1, int(position[2] or b'1')))
                elif sequence == b'\x1b[6n':
                    self.responses += 1
                    if self.responses > 64:
                        raise OverflowError('Terminal query limit')
                    replies.extend(f'\x1b[{self.row};{self.column}R'.encode('ascii'))
        return replies

class GuardianState:
    # fixture_command exists only for direct subprocess tests; never a protocol field.
    def __init__(self, fixture_command=None):
        self.fixture_command = fixture_command
        self.process = None
        self.master = None
        self.snapshot = None
        self.redactor = Redactor()
        self.seen_inputs = set()
        self.pending_input_id = None
        self.pending_input_bytes = bytearray()
        self.record = META / f'{os.getpid()}.json'
    def append(self, text):
        s = self.snapshot
        s['cursor'] += len(text)
        s['output'] += text
        while len(s['output'].encode('utf-8')) > MAX_OUTPUT:
            s['output'] = s['output'][max(1, len(s['output']) // 8):]
        s['output_start'] = s['cursor'] - len(s['output'])
    def persist(self):
        # Guardian is the subreaper: include live descendants, even those that setsid.
        pids = set(children())
        changed = True
        while changed:
            changed = False
            for pid in list(pids):
                try:
                    more = {int(x) for x in pathlib.Path(f'/proc/{pid}/task/{pid}/children').read_text().split()}
                    if more - pids: pids |= more; changed = True
                except OSError: pass
        data = {'guardian': os.getpid(), 'guardian_ticks': ticks(os.getpid()), 'children': [{'pid': p, 'ticks': ticks(p)} for p in pids if ticks(p)]}
        temp = self.record.with_suffix('.tmp')
        fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'w') as f: json.dump(data, f)
        os.replace(temp, self.record)
    def finish(self, status, reason):
        if self.process:
            try: os.killpg(self.process.pid, signal.SIGKILL)
            except ProcessLookupError: pass
            self.process.wait(timeout=3)
            reap_all()
            if self.master is not None:
                os.close(self.master)
                self.master = None
            self.snapshot['exit_code'] = self.process.returncode
            self.process = None
        if self.snapshot:
            self.append(self.redactor.feed(b'', final=True))
            self.snapshot.update(status=status, reason=reason)
        self.pending_input_bytes.clear()
        self.pending_input_id = None
        self.record.unlink(missing_ok=True)
    def start(self, desired):
        provider = desired['provider']
        if provider not in PROVIDERS: raise ValueError('Invalid provider')
        cwd = pathlib.Path(desired['cwd']).resolve(strict=True)
        if not cwd.is_dir() or not cwd.is_relative_to('/workspace'): raise ValueError('Invalid cwd')
        ttl, idle = desired['ttl_seconds'], desired['idle_timeout_seconds']
        if type(ttl) is not int or not 60 <= ttl <= 900 or type(idle) is not int or not 30 <= idle <= 300: raise ValueError('Invalid deadline')
        sid = desired['session_id']
        if not isinstance(sid, str) or not 1 <= len(sid) <= 128: raise ValueError('Invalid session')
        self.redactor = Redactor()
        self.seen_inputs.clear()
        self.pending_input_id = None
        self.pending_input_bytes.clear()
        self.terminal_queries = TerminalQueries()
        self.terminal_replies = bytearray()
        self.snapshot = dict(session_id=sid, status='running', output='', output_start=0, cursor=0, exit_code=None, reason=None, ack_input_id=None)
        self.started = self.activity = time.monotonic()
        self.ttl, self.idle, self.provider, self.drained = ttl, idle, provider, 0
        # Also honor the server's absolute wall deadline after delays in delivery.
        expiry = desired['expires_at']
        if type(expiry) is not int or not 0 < expiry < 100000000000000:
            raise ValueError('Invalid expiry')
        self.ttl = min(ttl, max(0, expiry / 1000 - time.time()))
        master, slave = pty.openpty()
        # Supply usable geometry before any CLI queries its terminal width.
        fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", 30, 120, 0, 0))
        attrs = termios.tcgetattr(slave)
        attrs[3] &= ~(termios.ECHO | termios.ECHONL)
        termios.tcsetattr(slave, termios.TCSANOW, attrs)
        env = {'HOME': '/home/node', 'PATH': '/usr/local/bin:/usr/bin:/bin', 'LANG': 'C.UTF-8', 'USER': 'node', 'LOGNAME': 'node', 'TERM': 'dumb', 'BROWSER': 'echo', 'CI': 'false'}
        command = self.fixture_command or ['/bin/bash', '--noprofile', '--norc', '/workspace/scripts/devctl', provider, 'login']
        guardian_pid = os.getpid()
        def setup_terminal():
            os.setsid()
            fcntl.ioctl(0, termios.TIOCSCTTY, 0)
            # This broker is single-threaded; no unsafe threaded preexec hooks.
            if ctypes.CDLL(None).prctl(1, signal.SIGKILL, 0, 0, 0) != 0 or os.getppid() != guardian_pid:
                os._exit(126)
        try:
            self.process = subprocess.Popen(command, cwd=cwd, env=env, stdin=slave, stdout=slave, stderr=slave, preexec_fn=setup_terminal)
            self.master = master
        except BaseException:
            os.close(master)
            raise
        finally: os.close(slave)
        os.set_blocking(master, False)
        self.persist()
    def apply(self, desired):
        if desired is None:
            if self.process: self.finish('stopped', 'stopped')
            return
        if not isinstance(desired, dict): raise ValueError('Invalid session')
        if not self.snapshot or self.snapshot['session_id'] != desired.get('session_id'):
            if self.process: self.finish('stopped', 'stopped')
            if desired.get('status') == 'pending': self.start(desired)
        if not self.snapshot or self.snapshot['session_id'] != desired.get('session_id'): return
        if desired.get('status') in TERMINAL or desired.get('status') == 'stop_requested':
            if self.process: self.finish('stopped', 'stopped')
            return
        entry = desired.get('pending_input')
        if entry and self.process:
            iid = entry.get('input_id')
            if not isinstance(iid, str) or not 1 <= len(iid) <= 128: raise ValueError('Invalid input id')
            if self.pending_input_id is not None:
                if iid != self.pending_input_id: raise ValueError('Input already pending')
                self.flush_input()
            elif iid in self.seen_inputs:
                self.snapshot['ack_input_id'] = iid
            else:
                value = entry.get('input')
                if not valid_input(self.provider, entry.get('input_type'), value): raise ValueError('Invalid input')
                if len(self.seen_inputs) >= 100: raise ValueError('Input limit')
                if entry['input_type'] == 'verification_code': self.redactor.values.append(value)
                # One bounded input is retained across nonblocking partial writes.
                # CR supports raw prompts and canonical ICRNL line readers.
                self.pending_input_bytes = bytearray((value + '\r').encode())
                self.pending_input_id = iid
                self.flush_input()
    def flush_input(self):
        if not self.pending_input_bytes: return
        try:
            written = os.write(self.master, self.pending_input_bytes)
        except (BlockingIOError, InterruptedError):
            return
        del self.pending_input_bytes[:written]
        if not self.pending_input_bytes:
            self.seen_inputs.add(self.pending_input_id)
            self.snapshot['ack_input_id'] = self.pending_input_id
            self.pending_input_id = None
            self.activity = time.monotonic()
    def flush_terminal_replies(self):
        if self.terminal_replies:
            try:
                written = os.write(self.master, self.terminal_replies)
                del self.terminal_replies[:written]
            except BlockingIOError:
                pass  # Retry on the next guardian tick, without extending idle TTL.
    def tick(self):
        if not self.process: return
        now = time.monotonic()
        if now - self.started >= self.ttl: self.finish('expired', 'ttl_expired'); return
        if now - self.activity >= self.idle: self.finish('expired', 'idle_expired'); return
        try:
            self.flush_input()
            self.flush_terminal_replies()
            for _ in range(16):
                chunk = os.read(self.master, 4096)
                if not chunk: break
                self.drained += len(chunk)
                self.terminal_replies.extend(self.terminal_queries.feed(chunk))
                if len(self.terminal_replies) > 1024:
                    self.finish('failed', 'output_flood'); return
                self.flush_terminal_replies()
                self.append(self.redactor.feed(chunk))
                if self.drained > MAX_FLOOD: self.finish('failed', 'output_flood'); return
        except OverflowError:
            self.finish('failed', 'output_flood'); return
        except BlockingIOError: pass
        except OSError: pass # Linux PTY EIO when its slave closes.
        self.persist()
        if self.process.poll() is not None:
            self.finish('completed' if self.process.returncode == 0 else 'failed', 'exit')
        elif self.snapshot['output']: self.snapshot['status'] = 'waiting_for_input'

class Guardian:
    def __init__(self):
        recover()
        parent, child = socket.socketpair()
        parent_pid = os.getpid()
        self.pid = os.fork()
        if self.pid == 0:
            parent.close()
            state = GuardianState()
            try:
                libc = ctypes.CDLL(None, use_errno=True)
                if libc.prctl(36, 1, 0, 0, 0) != 0: raise RuntimeError('Cannot subreap')
                def terminate(*_): raise SystemExit()
                signal.signal(signal.SIGTERM, terminate)
                signal.signal(signal.SIGINT, terminate)
                if libc.prctl(1, signal.SIGTERM, 0, 0, 0) != 0 or os.getppid() != parent_pid: raise SystemExit()
                buffer = b''
                while True:
                    state.tick()
                    if select.select([child], [], [], .05)[0]:
                        data = child.recv(65536)
                        if not data: break
                        buffer += data
                        if len(buffer) > 65536: break
                        while b'\n' in buffer:
                            line, buffer = buffer.split(b'\n', 1)
                            message = json.loads(line)
                            try:
                                if 'desired' in message: state.apply(message['desired'])
                                result = {'session': state.snapshot}
                            except (ValueError, KeyError, TypeError, OSError):
                                result = {'session': state.snapshot, 'error': 'invalid_request'}
                            child.sendall(json.dumps(result, ensure_ascii=False).encode() + b'\n')
            except (SystemExit, OSError): pass
            finally:
                try: state.finish('stopped', 'guardian_lost')
                finally: child.close(); os._exit(0)
        child.close()
        self.socket = parent
        self.socket.settimeout(5)
        self.buffer = b''
        # Created only in the parent after fork; the guardian child never uses it.
        self._sync_lock = threading.Lock()
    def sync(self, desired=UNSET):
        with self._sync_lock:
            message = {} if desired is UNSET else {'desired': desired}
            self.socket.sendall(json.dumps(message).encode() + b'\n')
            while b'\n' not in self.buffer:
                chunk = self.socket.recv(65536)
                if not chunk: raise RuntimeError('Guardian disconnected')
                self.buffer += chunk
            line, self.buffer = self.buffer.split(b'\n', 1)
            result = json.loads(line)
            if result.get('error'): raise ValueError('Invalid guardian request')
            return result['session']
    def close(self):
        self.socket.close()
        deadline = time.monotonic() + 4
        while time.monotonic() < deadline:
            try:
                if os.waitpid(self.pid, os.WNOHANG)[0]: return
            except ChildProcessError: return
            time.sleep(.02)
        os.kill(self.pid, signal.SIGTERM)
        os.waitpid(self.pid, 0)
