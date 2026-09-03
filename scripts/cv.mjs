import { spawnSync } from 'node:child_process';

const [command, ...rest] = process.argv.slice(2);

const usage = `CV generator\n\nCommands:\n  node scripts/cv.mjs list\n  node scripts/cv.mjs render <variant> [--output <directory>]\n  node scripts/cv.mjs render-all [--output <directory>]\n\nExamples:\n  node scripts/cv.mjs render product-frontend\n  node scripts/cv.mjs render fullstack-healthcare --output ./tmp/cvs\n  node scripts/cv.mjs render-all\n`;

let renderArgs;

switch (command) {
  case 'list':
    renderArgs = ['--list'];
    break;
  case 'render':
    renderArgs = rest;
    break;
  case 'render-all':
    renderArgs = ['--all', ...rest];
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    console.log(usage);
    process.exit(0);
    break;
  default:
    console.error(`Unknown CV command: ${command}\n`);
    console.log(usage);
    process.exit(1);
}

const result = spawnSync(
  'pnpm',
  ['exec', 'tsx', 'scripts/render-cv-pdf.tsx', ...renderArgs],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
