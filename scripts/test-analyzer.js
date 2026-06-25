#!/usr/bin/env node

/**
 * Store Analyzer test runner.
 *
 * Default mode runs the analyzer unit suite and writes markdown/JSON reports.
 * Use --live to verify a running dev/prod API endpoint with response-shape checks.
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ANALYZER_UNIT_TEST_FILES = [
  'tests/services/analyzer.test.ts',
  'tests/api/analyze-store.route.test.ts',
  'tests/utils/safe-store-fetch.test.ts',
  'tests/utils/store-url.test.ts',
  'tests/lib/analyzer-progress.test.ts',
  'tests/hooks/use-analyzer-progress.test.tsx',
  'tests/services/analyzer-response.test.ts',
  'tests/services/ai-readiness.test.ts',
  'tests/services/analyzer-best-practices-fallback.test.ts',
  'tests/validation/analyze-store.test.ts',
  'tests/scripts/test-analyzer.test.ts',
];

const REQUIRED_SECTIONS = [
  'performance',
  'seo',
  'accessibility',
  'bestPractices',
  'cart',
  'trust',
];

const VALID_STATUSES = new Set(['critical', 'warning', 'good', 'excellent']);
const DEFAULT_REPORT_DIR = path.join('.test-results', 'analyzer');

function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const options = {
    unit: true,
    live: false,
    baseUrl: env.ANALYZER_TEST_BASE_URL || 'http://localhost:3000',
    storeUrl: env.ANALYZER_TEST_STORE_URL || 'https://example.com',
    email: env.ANALYZER_TEST_EMAIL || 'analyzer-test@example.com',
    locale: env.ANALYZER_TEST_LOCALE || 'en',
    captchaToken: env.ANALYZER_TEST_CAPTCHA_TOKEN || 'test-token',
    timeoutMs: Number(env.ANALYZER_TEST_TIMEOUT_MS || 120000),
    markdownOutput: env.ANALYZER_TEST_REPORT || path.join(DEFAULT_REPORT_DIR, 'latest.md'),
    jsonOutput: env.ANALYZER_TEST_JSON || path.join(DEFAULT_REPORT_DIR, 'latest.json'),
    verbose: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (!argv[i]) {
        throw new Error(`${arg} requires a value`);
      }
      return argv[i];
    };

    switch (arg) {
      case '--unit':
        options.unit = true;
        break;
      case '--no-unit':
        options.unit = false;
        break;
      case '--live':
        options.live = true;
        break;
      case '--no-live':
        options.live = false;
        break;
      case '--base-url':
        options.baseUrl = next();
        break;
      case '--store-url':
        options.storeUrl = next();
        break;
      case '--email':
        options.email = next();
        break;
      case '--locale':
        options.locale = next();
        break;
      case '--captcha-token':
        options.captchaToken = next();
        break;
      case '--timeout-ms':
        options.timeoutMs = Number(next());
        break;
      case '--output':
        options.markdownOutput = next();
        break;
      case '--json-output':
        options.jsonOutput = next();
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!options.unit && !options.live) {
    throw new Error('Nothing to run. Enable --unit, --live, or both.');
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new Error('--timeout-ms must be a positive number');
  }

  return options;
}

function printHelp() {
  console.log(`Store Analyzer test runner

Usage:
  node scripts/test-analyzer.js [options]

Common commands:
  pnpm test:analyzer              Run unit suite and write reports
  pnpm test:analyzer:live         Probe http://localhost:3000/api/analyze-store
  pnpm test:analyzer:all          Run unit suite, then live API probe

Options:
  --unit / --no-unit              Enable or disable unit suite
  --live / --no-live              Enable or disable live API probe
  --base-url <url>                API host for live probe
  --store-url <url>               Store URL sent to analyzer
  --email <email>                 Email sent to analyzer
  --locale <locale>               Locale sent to analyzer
  --captcha-token <token>         Captcha token sent when live probing
  --timeout-ms <ms>               Live probe timeout
  --output <file>                 Markdown report path
  --json-output <file>            JSON report path
  --verbose                       Print captured command output
`);
}

function nowIso() {
  return new Date().toISOString();
}

function commandForPnpm() {
  return 'pnpm';
}

function runCommand(command, args, options = {}) {
  const startedAt = Date.now();

  return new Promise(resolve => {
    const spawnCommand = process.platform === 'win32' ? 'cmd.exe' : command;
    const spawnArgs =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', [command, ...args].map(windowsShellQuote).join(' ')]
        : args;

    const child = spawn(spawnCommand, spawnArgs, {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      stdout += text;
      if (options.echo) process.stdout.write(text);
    });

    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      stderr += text;
      if (options.echo) process.stderr.write(text);
    });

    child.on('error', error => {
      resolve({
        ok: false,
        exitCode: 1,
        stdout,
        stderr: `${stderr}${error.message}`,
        durationMs: Date.now() - startedAt,
      });
    });

    child.on('close', exitCode => {
      resolve({
        ok: exitCode === 0,
        exitCode,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

function windowsShellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_/:.,=+-]+$/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

async function runUnitSuite(options) {
  const args = ['exec', 'vitest', 'run', ...ANALYZER_UNIT_TEST_FILES, '--reporter=verbose'];
  const result = await runCommand(commandForPnpm(), args, { echo: options.verbose });

  return {
    kind: 'unit',
    ok: result.ok,
    command: `pnpm ${args.join(' ')}`,
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    summary: parseVitestSummary(result.stdout + result.stderr),
  };
}

function parseVitestSummary(output) {
  const filesMatch = output.match(/Test Files\s+(\d+) passed(?: \((\d+)\))?/);
  const testsMatch = output.match(/Tests\s+(\d+) passed(?: \((\d+)\))?/);
  const failedFilesMatch = output.match(/Test Files\s+(\d+) failed/);
  const failedTestsMatch = output.match(/Tests\s+(\d+) failed/);

  return {
    passedFiles: filesMatch ? Number(filesMatch[1]) : 0,
    totalFiles: filesMatch?.[2] ? Number(filesMatch[2]) : undefined,
    passedTests: testsMatch ? Number(testsMatch[1]) : 0,
    totalTests: testsMatch?.[2] ? Number(testsMatch[2]) : undefined,
    failedFiles: failedFilesMatch ? Number(failedFilesMatch[1]) : 0,
    failedTests: failedTestsMatch ? Number(failedTestsMatch[1]) : 0,
  };
}

function isNumberBetween(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function addCheck(checks, name, pass, details) {
  checks.push({
    name,
    pass: Boolean(pass),
    details: details || (pass ? 'OK' : 'Failed'),
  });
}

function validateAnalyzerResponse(result) {
  const checks = [];

  addCheck(
    checks,
    'overallScore is 0-100',
    isNumberBetween(result?.overallScore, 0, 100),
    `overallScore=${result?.overallScore}`
  );
  addCheck(
    checks,
    'generatedAt is parseable',
    typeof result?.generatedAt === 'string' && !Number.isNaN(Date.parse(result.generatedAt)),
    `generatedAt=${result?.generatedAt}`
  );
  addCheck(checks, 'storeUrl is returned', typeof result?.storeUrl === 'string', result?.storeUrl);

  for (const sectionKey of REQUIRED_SECTIONS) {
    const section = result?.sections?.[sectionKey];
    addCheck(checks, `${sectionKey} section exists`, Boolean(section), section?.name);
    addCheck(
      checks,
      `${sectionKey} score is 0-100`,
      isNumberBetween(section?.score, 0, 100),
      `score=${section?.score}`
    );
    addCheck(
      checks,
      `${sectionKey} status is valid`,
      VALID_STATUSES.has(section?.status),
      `status=${section?.status}`
    );
    addCheck(
      checks,
      `${sectionKey} findings are an array`,
      Array.isArray(section?.findings),
      `findings=${section?.findings?.length ?? 'missing'}`
    );
    addCheck(
      checks,
      `${sectionKey} recommendations are an array`,
      Array.isArray(section?.recommendations),
      `recommendations=${section?.recommendations?.length ?? 'missing'}`
    );
  }

  const meta = result?.meta;
  addCheck(checks, 'meta object exists', Boolean(meta), meta ? 'present' : 'missing');
  for (const key of [
    'usedLighthouse',
    'usedHtmlFallback',
    'visualAnalysisAttempted',
    'visualAnalysisAvailable',
    'productAnalysisAvailable',
    'competitorAnalysisAvailable',
    'cached',
  ]) {
    addCheck(checks, `meta.${key} is boolean`, typeof meta?.[key] === 'boolean', String(meta?.[key]));
  }

  if (result?.visualAnalysis) {
    addCheck(
      checks,
      'visual mobile score is 0-100',
      isNumberBetween(result.visualAnalysis.mobileResponsivenessScore, 0, 100),
      `mobileResponsivenessScore=${result.visualAnalysis.mobileResponsivenessScore}`
    );
    addCheck(
      checks,
      'visual screenshots are stripped from API payload',
      !meta?.screenshotsInEmailReport || result.visualAnalysis.screenshots?.length === 0,
      `screenshots=${result.visualAnalysis.screenshots?.length ?? 'missing'}`
    );
  }

  if (result?.aiAnalysis) {
    addCheck(
      checks,
      'AI structured data uses structuredDataTypes',
      Array.isArray(result.aiAnalysis.structuredDataTypes),
      `structuredDataTypes=${result.aiAnalysis.structuredDataTypes?.length ?? 'missing'}`
    );
    addCheck(
      checks,
      'AI readiness score is 0-100',
      isNumberBetween(result.aiAnalysis.score, 0, 100),
      `score=${result.aiAnalysis.score}`
    );
  }

  const recommendations = REQUIRED_SECTIONS.flatMap(sectionKey =>
    result?.sections?.[sectionKey]?.recommendations?.map(rec => ({
      ...rec,
      sectionKey,
    })) || []
  );

  addCheck(
    checks,
    'recommendations include actionable copy when present',
    recommendations.every(rec => rec.title && rec.impact && (rec.action || rec.description)),
    `${recommendations.length} recommendations checked`
  );

  return {
    ok: checks.every(check => check.pass),
    checks,
    recommendationCount: recommendations.length,
    highImpactCount: recommendations.filter(rec => rec.impact === 'high').length,
    topRecommendations: recommendations.slice(0, 5).map(rec => ({
      sectionKey: rec.sectionKey,
      impact: rec.impact,
      title: rec.title,
      action: rec.action,
      evidence: rec.evidence,
    })),
  };
}

async function runLiveProbe(options) {
  const startedAt = Date.now();
  const endpoint = new URL('/api/analyze-store', options.baseUrl).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const payload = {
    storeUrl: options.storeUrl,
    email: options.email,
    subscribeNewsletter: false,
    locale: options.locale,
    captchaToken: options.captchaToken,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      return {
        kind: 'live',
        ok: false,
        endpoint,
        status: response.status,
        durationMs: Date.now() - startedAt,
        error: json?.error || text || `HTTP ${response.status}`,
        responseHeaders: {
          retryAfter: response.headers.get('Retry-After'),
          rateLimitRemaining: response.headers.get('X-RateLimit-Remaining'),
        },
      };
    }

    const validation = validateAnalyzerResponse(json);

    return {
      kind: 'live',
      ok: validation.ok,
      endpoint,
      status: response.status,
      durationMs: Date.now() - startedAt,
      validation,
      resultSummary: summarizeAnalyzerResult(json),
    };
  } catch (error) {
    return {
      kind: 'live',
      ok: false,
      endpoint,
      durationMs: Date.now() - startedAt,
      error:
        error?.name === 'AbortError'
          ? `Timed out after ${options.timeoutMs}ms`
          : error?.message || String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

function summarizeAnalyzerResult(result) {
  if (!result) return null;

  return {
    storeUrl: result.storeUrl,
    platform: result.platform || 'Unknown',
    overallScore: result.overallScore,
    generatedAt: result.generatedAt,
    meta: result.meta,
    sections: Object.fromEntries(
      REQUIRED_SECTIONS.map(key => [
        key,
        {
          score: result.sections?.[key]?.score,
          status: result.sections?.[key]?.status,
          recommendations: result.sections?.[key]?.recommendations?.length || 0,
        },
      ])
    ),
  };
}

function statusText(ok) {
  return ok ? 'PASS' : 'FAIL';
}

function ms(msValue) {
  if (!Number.isFinite(msValue)) return 'n/a';
  if (msValue < 1000) return `${msValue}ms`;
  return `${(msValue / 1000).toFixed(1)}s`;
}

function tail(text, maxLines = 60) {
  if (!text) return '';
  return text.trim().split(/\r?\n/).slice(-maxLines).join('\n');
}

function buildMarkdownReport(report) {
  const lines = [
    '# Store Analyzer Test Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Overall: ${statusText(report.ok)}`,
    '',
    '## Runs',
    '',
    '| Run | Status | Duration | Notes |',
    '| --- | --- | ---: | --- |',
  ];

  if (report.unit) {
    const summary = report.unit.summary || {};
    lines.push(
      `| Unit suite | ${statusText(report.unit.ok)} | ${ms(report.unit.durationMs)} | ${summary.passedTests || 0} tests, ${summary.passedFiles || 0} files |`
    );
  }

  if (report.live) {
    const note = report.live.ok
      ? `${report.live.resultSummary?.overallScore ?? 'n/a'}/100 for ${report.live.resultSummary?.storeUrl ?? report.options.storeUrl}`
      : report.live.error || `HTTP ${report.live.status}`;
    lines.push(`| Live API | ${statusText(report.live.ok)} | ${ms(report.live.durationMs)} | ${note} |`);
  }

  lines.push('', '## Commands', '');
  if (report.unit) lines.push(`- Unit: \`${report.unit.command}\``);
  if (report.live) {
    lines.push(`- Live: \`node scripts/test-analyzer.js --no-unit --live --base-url ${report.options.baseUrl} --store-url ${report.options.storeUrl}\``);
  }

  if (report.live?.validation?.checks?.length) {
    lines.push('', '## Live Response Checks', '');
    lines.push('| Check | Status | Details |');
    lines.push('| --- | --- | --- |');
    for (const check of report.live.validation.checks) {
      lines.push(`| ${check.name} | ${statusText(check.pass)} | ${String(check.details).replace(/\|/g, '\\|')} |`);
    }
  }

  if (report.live?.validation?.topRecommendations?.length) {
    lines.push('', '## Top Live Recommendations', '');
    for (const rec of report.live.validation.topRecommendations) {
      lines.push(
        `- [${rec.impact}] ${rec.sectionKey}: ${rec.title}${rec.evidence ? ` (${rec.evidence})` : ''}`
      );
    }
  }

  if (report.unit && !report.unit.ok) {
    lines.push('', '## Unit Output Tail', '', '```text', tail(report.unit.stdout + report.unit.stderr), '```');
  }

  if (report.live && !report.live.ok) {
    lines.push('', '## Live Failure', '', '```text', report.live.error || `HTTP ${report.live.status}`, '```');
  }

  lines.push('');
  return lines.join('\n');
}

async function writeReportFiles(report, options) {
  await fs.mkdir(path.dirname(options.markdownOutput), { recursive: true });
  await fs.mkdir(path.dirname(options.jsonOutput), { recursive: true });
  await fs.writeFile(options.markdownOutput, buildMarkdownReport(report), 'utf8');
  await fs.writeFile(options.jsonOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function printConsoleSummary(report) {
  console.log(`Store Analyzer tests: ${statusText(report.ok)}`);

  if (report.unit) {
    const summary = report.unit.summary || {};
    console.log(
      `- Unit suite: ${statusText(report.unit.ok)} (${summary.passedTests || 0} tests, ${ms(report.unit.durationMs)})`
    );
  }

  if (report.live) {
    const detail = report.live.ok
      ? `${report.live.resultSummary?.overallScore ?? 'n/a'}/100, ${report.live.validation?.recommendationCount ?? 0} recommendations`
      : report.live.error || `HTTP ${report.live.status}`;
    console.log(`- Live API: ${statusText(report.live.ok)} (${detail}, ${ms(report.live.durationMs)})`);
  }

  console.log(`- Markdown report: ${report.options.markdownOutput}`);
  console.log(`- JSON report: ${report.options.jsonOutput}`);
}

async function main() {
  const options = parseArgs();
  if (options.help) {
    printHelp();
    return 0;
  }

  const report = {
    generatedAt: nowIso(),
    options: {
      unit: options.unit,
      live: options.live,
      baseUrl: options.baseUrl,
      storeUrl: options.storeUrl,
      locale: options.locale,
      timeoutMs: options.timeoutMs,
      markdownOutput: options.markdownOutput,
      jsonOutput: options.jsonOutput,
    },
    ok: true,
  };

  if (options.unit) {
    report.unit = await runUnitSuite(options);
    report.ok = report.ok && report.unit.ok;
  }

  if (options.live) {
    report.live = await runLiveProbe(options);
    report.ok = report.ok && report.live.ok;
  }

  await writeReportFiles(report, options);
  printConsoleSummary(report);

  return report.ok ? 0 : 1;
}

if (require.main === module) {
  main()
    .then(code => {
      process.exitCode = code;
    })
    .catch(error => {
      console.error(error.message || error);
      process.exitCode = 1;
    });
}

module.exports = {
  ANALYZER_UNIT_TEST_FILES,
  REQUIRED_SECTIONS,
  buildMarkdownReport,
  parseArgs,
  parseVitestSummary,
  summarizeAnalyzerResult,
  validateAnalyzerResponse,
};
