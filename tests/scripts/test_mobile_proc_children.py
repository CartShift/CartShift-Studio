"""Portable regressions for optional Linux proc children support; no credentials."""
import ast
import os
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

SOURCE=Path(__file__).resolve().parents[2]/'scripts/ai-docker-sandbox-worker.py'
class ProcChildrenTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        tree=ast.parse(SOURCE.read_text(encoding='utf-8'))
        node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='direct_children')
        self.ns={'Path':lambda p:self.root/str(p).removeprefix('/proc').lstrip('/'), 'os':types.SimpleNamespace(getpid=lambda:100)}
        exec(compile(ast.Module(body=[node],type_ignores=[]),str(SOURCE),'exec'),self.ns)
        self.child_file=self.root/'self/task/100/children'
    def proc(self,pid,parent,name='process'):
        p=self.root/str(pid)/'stat';p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(f'{pid} ({name}) S {parent} '+'0 '*48)
    def call(self):return self.ns['direct_children']()
    def test_existing_children_interface_is_preserved(self):
        self.child_file.parent.mkdir(parents=True);self.child_file.write_text('101 102 ')
        self.assertEqual(self.call(),{101,102})
    def test_missing_optional_interface_uses_direct_parent_ids(self):
        self.proc(100,1);self.proc(101,100);self.proc(102,1);self.proc(103,101)
        self.assertEqual(self.call(),{101})
    def test_stat_command_may_contain_spaces_and_parentheses(self):
        self.proc(100,1);self.proc(101,100,'name ) with ( spaces) ')
        self.assertEqual(self.call(),{101})
    def test_disappearing_process_is_not_a_visibility_failure(self):
        self.proc(100,1);self.proc(101,100);read=Path.read_text
        def racing(path,*a,**kw):
            if path==self.root/'101/stat':raise FileNotFoundError()
            return read(path,*a,**kw)
        with patch.object(Path,'read_text',racing):self.assertEqual(self.call(),set())
    def test_permission_failure_is_not_silently_suppressed(self):
        self.proc(100,1);self.proc(101,100);read=Path.read_text
        def denied(path,*a,**kw):
            if path==self.root/'101/stat':raise PermissionError()
            return read(path,*a,**kw)
        with patch.object(Path,'read_text',denied),self.assertRaises(PermissionError):self.call()
    def test_malformed_process_metadata_fails_closed(self):
        self.proc(100,1);self.proc(101,100);(self.root/'101/stat').write_text('malformed')
        with self.assertRaises(RuntimeError):self.call()
    def test_missing_own_process_refuses_empty_proc_view(self):
        self.proc(101,1)
        with self.assertRaises(RuntimeError):self.call()
    def test_denied_children_interface_does_not_bypass_permissions(self):
        self.proc(100,1);read=Path.read_text
        def denied(path,*a,**kw):
            if path==self.child_file:raise PermissionError()
            return read(path,*a,**kw)
        with patch.object(Path,'read_text',denied),self.assertRaises(PermissionError):self.call()
class ExecutionSupportTests(unittest.TestCase):
    def load(self, result=0, children=lambda:set()):
        tree=ast.parse(SOURCE.read_text(encoding='utf-8'))
        node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='verify_command_runtime')
        ns={'ctypes':types.SimpleNamespace(CDLL=lambda *a,**kw:types.SimpleNamespace(prctl=lambda *args:result)), 'direct_children':children}
        exec(compile(ast.Module(body=[node],type_ignores=[]),str(SOURCE),'exec'),ns)
        return ns['verify_command_runtime']
    def test_subreaper_failure_refuses_command_runtime(self):
        def never():raise AssertionError('must not inspect after failed subreaper')
        with self.assertRaises(RuntimeError):self.load(-1,never)()
    def test_visibility_failure_refuses_command_runtime(self):
        def denied():raise PermissionError()
        with self.assertRaises(PermissionError):self.load(0,denied)()
    def test_supported_runtime_returns_baseline_children(self):
        self.assertEqual(self.load(0,lambda:{101})(),{101})
if __name__=='__main__':unittest.main()
