import { execFileSync } from 'node:child_process';
import { argv, stderr, stdout } from 'node:process';
import { pathToFileURL } from 'node:url';

// Keep this independent of npm dependencies: scope detection runs before install.
const DOC_PREFIXES = ['docs/'];
const DOC_FILES = new Set(['README.md', 'DESIGN.md']);
const FUNCTION_PREFIXES = ['functions/', 'tests/functions/'];
const RULE_PREFIXES = ['tests/firestore/', 'tests/storage/'];
const RULE_FILES = new Set([
  'firestore.rules',
  'storage.rules',
  'firestore.indexes.json',
  'firebase.json',
  '.firebaserc',
  '.firebaseignore',
  'apphosting.yaml',
]);
const SHARED_FILES = new Set(['pnpm-lock.yaml', 'pnpm-workspace.yaml', '.github/workflows/ci.yml']);

export function classifyChanges(paths) {
  // On an unknown diff, run every gate instead of silently skipping safety checks.
  if (!Array.isArray(paths) || paths.length === 0) {
    return { frontend: true, functions: true, rules: true };
  }

  const checks = { frontend: false, functions: false, rules: false };
  for (const path of paths) {
    if (SHARED_FILES.has(path)) {
      return { frontend: true, functions: true, rules: true };
    }
    if (DOC_FILES.has(path) || DOC_PREFIXES.some(prefix => path.startsWith(prefix))) continue;
    if (
      FUNCTION_PREFIXES.some(prefix => path.startsWith(prefix)) ||
      path === '.github/workflows/functions-qa.yml'
    ) {
      checks.functions = true;
      continue;
    }
    if (
      RULE_FILES.has(path) ||
      RULE_PREFIXES.some(prefix => path.startsWith(prefix)) ||
      path === '.github/workflows/firestore-rules-qa.yml'
    ) {
      checks.rules = true;
      continue;
    }
    checks.frontend = true;
  }
  return checks;
}

export function getChangedFiles(base, head = 'HEAD') {
  if (!/^[a-f0-9]{40}$/i.test(base || '')) {
    throw new Error('Missing or invalid CI base revision');
  }
  const result = execFileSync('git', ['diff', '--name-only', '-z', base, head], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result.split('\0').filter(Boolean);
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  let checks;
  try {
    checks = classifyChanges(getChangedFiles(argv[2] || ''));
  } catch (error) {
    stderr.write(`CI scope unavailable, running every gate: ${error instanceof Error ? error.message : String(error)}\n`);
    checks = classifyChanges(null);
  }
  for (const [name, enabled] of Object.entries(checks)) {
    stdout.write(`${name}=${enabled}\n`);
  }
}
