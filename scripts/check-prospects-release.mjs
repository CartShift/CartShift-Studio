#!/usr/bin/env node

// Offline, low-cost code gate. Does not deploy, scan stores, or touch production data.
import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';

const executable = platform() === 'win32' ? 'pnpm.cmd' : 'pnpm';
const suites = [
  'tests/domain/prospects.test.ts',
  'tests/domain/prospect-sales.test.ts',
  'tests/domain/prospect-privacy.test.ts',
  'tests/domain/prospect-contacts.test.ts',
  'tests/services/prospects-server.test.ts',
  'tests/services/prospect-privacy-server.test.ts',
  'tests/services/prospect-scan-engine.test.ts',
  'tests/services/prospect-site-audit.test.ts',
  'tests/services/prospect-lead-quality.test.ts',
  'tests/services/prospect-safe-http.test.ts',
  'tests/api/cartshift-mcp-prospects.test.ts',
  'tests/api/cartshift-mcp-operations.test.ts',
  'tests/api/cartshift-mcp-consent.test.ts',
  'tests/api/prospects.route.test.ts',
  'tests/security/prospect-firestore-rules.test.ts',
];
const lintTargets = [
  'lib/domain/prospects.ts',
  'lib/domain/prospect-sales.ts',
  'lib/domain/prospect-privacy.ts',
  'lib/services/prospect-privacy-server.ts',
  'lib/services/prospect-sales-server.ts',
  'lib/services/prospect-safe-http.ts',
  'lib/services/prospect-scan-engine.ts',
  'lib/services/prospect-site-audit.ts',
  'lib/services/prospect-scan-service.ts',
  'lib/mcp/prospect-tools.ts',
  'app/[locale]/portal/agency/prospects/ProspectsClient.tsx',
];

function gate(name, args) {
  process.stdout.write(`\n[Prospects gate] ${name}…\n`);
  const result = spawnSync(executable, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: platform() === 'win32',
    env: process.env,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[Prospects gate] ${name} failed (exit ${result.status ?? 'unknown'}).`);
    process.exit(result.status || 1);
  }
  console.log(`[Prospects gate] ${name}: PASS`);
}

gate('Merge translations', ['i18n:merge']);
gate('TypeScript', ['typecheck']);
gate('Focused Vitest', ['exec', 'vitest', 'run', ...suites]);
gate('Focused ESLint', ['exec', 'eslint', ...lintTargets]);

console.log('\n[Prospects gate] Local code checks passed.');
console.log('NOT checked: Firestore Emulator, authenticated browser/RTL QA, legal/privacy approval, live canary, OAuth reconnect.');
console.log('This command does not imply deployment or production readiness.');
