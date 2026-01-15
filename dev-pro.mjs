#!/usr/bin/env node
/**
 * CartShift Studio Development Server
 * Advanced startup with health monitoring, auto-restart, and beautiful output
 */

import { spawn, execSync } from 'child_process';
import { existsSync, unlinkSync, rmSync } from 'fs';
import { join } from 'path';

// ═══════════════════════════════════════════════════════════════════════════════
// ANSI COLORS & STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
  bgCyan: '\x1b[46m',
  bgMagenta: '\x1b[45m',
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const services = {
  web: {
    name: 'WEB',
    color: c.brightGreen,
    bgColor: c.bgGreen,
    icon: '🌐',
    url: 'http://localhost:3000',
    healthUrl: 'http://localhost:3000',
    command: 'pnpm',
    args: ['run', 'dev:legacy'],
    cwd: '.',
    readyPattern: /Ready in|✓ Ready/,
  },
  funcs: {
    name: 'FNC',
    color: c.brightYellow,
    bgColor: c.bgYellow,
    icon: '🔥', // Firebase flame
    url: 'http://localhost:4000',
    healthUrl: 'http://localhost:4000', // Emulator UI
    command: process.platform === 'win32' ? 'firebase.cmd' : 'firebase',
    args: ['emulators:start', '--only', 'functions'],
    cwd: '.',
    readyPattern: /All emulators ready/,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════════════════════

function showBanner() {
  console.clear();

  const banner = `
${c.brightCyan}${c.bold}    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║   ${c.brightBlue} ██████╗██████╗ ██████╗ ████████╗${c.brightGreen}███████╗██╗  ██╗██╗███████╗${c.brightCyan}  ║
    ║   ${c.brightBlue}██╔════╝██╔══██╗██╔══██╗╚══██╔══╝${c.brightGreen}██╔════╝██║  ██║██║██╔════╝${c.brightCyan}  ║
    ║   ${c.brightBlue}██║     ███████║██████╔╝   ██║   ${c.brightGreen}███████╗███████║██║█████╗  ${c.brightCyan}  ║
    ║   ${c.brightBlue}██║     ██╔══██║██╔══██╗   ██║   ${c.brightGreen}╚════██║██╔══██║██║██╔══╝  ${c.brightCyan}  ║
    ║   ${c.brightBlue}╚██████╗██║  ██║██║  ██║   ██║   ${c.brightGreen}███████║██║  ██║██║██║     ${c.brightCyan}  ║
    ║   ${c.brightBlue} ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ${c.brightGreen}╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ${c.brightCyan}  ║
    ║                                                                  ║
    ║           ${c.white}${c.dim}CartShift Studio - Next.js & Firebase Platform${c.brightCyan}${c.bold}         ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝${c.reset}
`;

  console.log(banner);
}

function showServiceInfo() {
  console.log(`
${c.gray}┌──────────────────────────────────────────────────────────────────────────┐${c.reset}
${c.gray}│${c.reset}  ${c.brightGreen}${c.bold}🌐 WEB${c.reset}       ${c.cyan}http://localhost:3000${c.reset}        ${c.dim}Next.js 15 • React 19${c.reset}   ${c.gray}│${c.reset}
${c.gray}│${c.reset}  ${c.brightYellow}${c.bold}🔥 FNC${c.reset}       ${c.cyan}http://localhost:4000${c.reset}        ${c.dim}Cloud Functions${c.reset}         ${c.gray}│${c.reset}
${c.gray}└──────────────────────────────────────────────────────────────────────────┘${c.reset}
`);

  console.log(`${c.dim}────────────────────────────────────────────────────────────────────────────${c.reset}`);
  console.log(`  ${c.yellow}⌨${c.reset}  ${c.bold}Ctrl+C${c.reset}  Stop all    ${c.cyan}r${c.reset}  Restart all    ${c.cyan}h${c.reset}  Health check    ${c.cyan}c${c.reset}  Clear`);
  console.log(`${c.dim}────────────────────────────────────────────────────────────────────────────${c.reset}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatPrefix(service, type = 'normal') {
  const time = `${c.dim}${getTimestamp()}${c.reset}`;
  const name = `${service.color}${c.bold}${service.name.padEnd(3)}${c.reset}`;

  switch (type) {
    case 'ready':
      return `${time} ${c.bgGreen}${c.bold} ✓ ${c.reset} ${name}`;
    case 'error':
      return `${time} ${c.bgRed}${c.bold} ✗ ${c.reset} ${name}`;
    case 'warn':
      return `${time} ${c.bgYellow}${c.bold} ! ${c.reset} ${name}`;
    case 'info':
      return `${time} ${c.bgCyan}${c.bold} ℹ ${c.reset} ${name}`;
    default:
      return `${time} ${service.bgColor} ${service.icon} ${c.reset} ${name}`;
  }
}

async function checkHealth(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLEANUP & PREP
// ═══════════════════════════════════════════════════════════════════════════════


async function cleanupPort(port) {
  const isWin = process.platform === 'win32';

  try {
    if (isWin) {
      // Windows: Find process using port and kill it
      const command = `netstat -ano | findstr :${port}`;
      try {
        const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
        const lines = output.trim().split('\n').filter(l => l.trim());
        const pids = new Set();

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && /^\d+$/.test(pid)) {
            pids.add(pid);
          }
        }

        for (const pid of pids) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
            console.log(`${c.yellow}   Killed process ${pid} on port ${port}${c.reset}`);
          } catch {
            // Process might already be dead
          }
        }
      } catch {
        // No process found on port - that's fine
      }

    } else {
      // Unix: Use lsof
      try {
        execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'pipe' });
      } catch {
        // No process found - that's fine
      }
    }
  } catch (_error) {
    // Ignore cleanup errors
  }
}

async function cleanupNextLock() {
  const lockPaths = [
    join(process.cwd(), '.next', 'dev', 'lock'), // Adjusted path for root .next
    join(process.cwd(), '.next', 'lock'),
  ];

  for (const lockPath of lockPaths) {
    if (existsSync(lockPath)) {
      try {
        unlinkSync(lockPath);
        console.log(`${c.yellow}   Removed Next.js lock file${c.reset}`);
      } catch (_error) {
        // Lock file might be in use or already gone
      }
    }
  }

  // Also try to remove .next/dev folder if it's problematic
  const devPath = join(process.cwd(), '.next', 'dev');
  if (existsSync(devPath)) {
    try {
      rmSync(devPath, { recursive: true, force: true });
      console.log(`${c.yellow}   Cleaned .next/dev directory${c.reset}`);
    } catch {
      // Directory might be in use - that's OK
    }
  }
}

function isPortInUse(port) {
  const isWin = process.platform === 'win32';
  try {
    if (isWin) {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: 'pipe' });
      return result.trim().length > 0;
    } else {
      execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
      return true;
    }
  } catch {
    return false;
  }
}

async function prepareEnvironment() {
  console.log(`${c.brightCyan}${c.bold}🧹 Cleaning up ports and lock files...${c.reset}\n`);

  // Clean up specific ports multiple times
  // 3000: Web, 4000: Emulator UI, 5001: Functions, 8080: Firestore, 9099: Auth
  const ports = [3000, 4000, 5001, 8080, 9099];

  for (const port of ports) {
    if (isPortInUse(port)) {
      await cleanupPort(port);
      await new Promise(r => setTimeout(r, 500));
      await cleanupPort(port);
    }
  }

  await cleanupNextLock();

  // Give ports time to fully release
  await new Promise(r => setTimeout(r, 2000));

  console.log();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const processes = new Map();
const serviceStatus = new Map();

function startService(key, service) {
  return new Promise((resolve) => {
    serviceStatus.set(key, 'starting');

    // Fix deprecation warning: use shell mode properly without args when shell=true
    const isWin = process.platform === 'win32';
    let proc;

    if (isWin) {
      // On Windows, for pnpm we need to use cmd.exe /c to avoid deprecation warning
      if (service.command === 'pnpm' || service.command.endsWith('.cmd')) {
        const fullCommand = `${service.command} ${service.args.join(' ')}`;
        proc = spawn('cmd.exe', ['/c', fullCommand], {
          cwd: service.cwd,
          shell: false,
          env: { ...process.env, FORCE_COLOR: '1' },
          windowsHide: true,
        });
      } else {
         // Other commands
        const fullCommand = service.args.length > 0
          ? `"${service.command}" ${service.args.map(arg => `"${arg}"`).join(' ')}`
          : `"${service.command}"`;
        proc = spawn(fullCommand, [], {
          cwd: service.cwd,
          shell: true,
          env: { ...process.env, FORCE_COLOR: '1' },
          windowsHide: true,
        });
      }
    } else {
      // Unix: spawn normally without shell
      proc = spawn(service.command, service.args, {
        cwd: service.cwd,
        shell: false,
        env: { ...process.env, FORCE_COLOR: '1' },
      });
    }

    processes.set(key, proc);

    let isReady = false;

    const handleOutput = (data, _isStderr = false) => {
      const lines = data.toString().split('\n').filter(l => l.trim());

      for (const line of lines) {
        // Check for ready pattern
        if (!isReady && service.readyPattern.test(line)) {
          isReady = true;
          serviceStatus.set(key, 'ready');
          console.log(`${formatPrefix(service, 'ready')} ${c.brightGreen}Service ready!${c.reset}`);
          resolve(true);
        }

        // Determine line type
        let type = 'normal';
        if (/error|Error|ERROR|exception|Exception|failed|Failed|FAILED|❌/.test(line)) {
          type = 'error';
        } else if (/warn|Warn|WARN|warning|Warning|⚠/.test(line)) {
          type = 'warn';
        } else if (/info|INFO|✓|ready|Ready|started|Started/.test(line)) {
          type = 'info';
        }

        // Skip noisy lines
        if (/^\s*$/.test(line) || /DEP0060/.test(line)) continue;

        const prefix = formatPrefix(service, type);
        console.log(`${prefix} ${c.dim}│${c.reset} ${line}`);
      }
    };

    proc.stdout.on('data', (data) => handleOutput(data));
    proc.stderr.on('data', (data) => handleOutput(data, true));

    proc.on('error', (error) => {
      console.log(`${formatPrefix(service, 'error')} ${c.red}Failed to start: ${error.message}${c.reset}`);
      serviceStatus.set(key, 'error');
      resolve(false);
    });

    proc.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`${formatPrefix(service, 'error')} ${c.red}Exited with code ${code}${c.reset}`);
        serviceStatus.set(key, 'stopped');
      }
    });

    // Timeout for ready detection (extended for Firebase)
    setTimeout(() => {
      if (!isReady) {
        console.log(`${formatPrefix(service, 'warn')} ${c.yellow}Taking longer than expected...${c.reset}`);
      }
    }, 20000);

    // Final timeout
    setTimeout(() => {
      if (!isReady) {
        resolve(false);
      }
    }, 60000);
  });
}

async function waitForPortFree(port, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    if (!isPortInUse(port)) {
      return true;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function startAllServices() {
  const startTime = Date.now();
  console.log(`${c.brightCyan}${c.bold}🚀 Starting services...${c.reset}\n`);

  // Verify ports are free before starting
  if (isPortInUse(3000)) {
    console.log(`${c.yellow}⚠ Port 3000 still in use, cleaning up again...${c.reset}`);
    await cleanupPort(3000);
    await new Promise(r => setTimeout(r, 1000));
  }

  // Start both services in parallel
  const promiseList = [startService('web', services.web)];

  // Optionally start firebase if needed, currently set to start
  promiseList.push(startService('funcs', services.funcs));

  await Promise.all(promiseList);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();

  const webStarted = serviceStatus.get('web') === 'ready';
  const funcsStarted = serviceStatus.get('funcs') === 'ready';

  if (webStarted) {
    console.log(`${c.brightGreen}${c.bold}✨ Services started!${c.reset} ${c.dim}(${duration}s)${c.reset}`);
    console.log(`${c.dim}   Press 'h' for health check, 'r' to restart, Ctrl+C to stop${c.reset}\n`);
  } else {
    console.log(`${c.brightYellow}${c.bold}⚠ Some services may not be ready yet${c.reset} ${c.dim}(${duration}s)${c.reset}`);
    console.log(`${c.dim}   Check the logs above for details${c.reset}\n`);
  }
}

function stopAllServices() {
  console.log(`\n${c.yellow}${c.bold}🛑 Stopping services...${c.reset}`);

  for (const [key, proc] of processes) {
    if (proc && !proc.killed) {
      if (process.platform === 'win32') {
        try {
          execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
        } catch(e) { /* ignore */ }
      } else {
        proc.kill('SIGTERM');
      }
      console.log(`${c.dim}   Stopped ${services[key].name}${c.reset}`);
    }
  }

  processes.clear();
  console.log(`${c.green}${c.bold}✓ All services stopped${c.reset}\n`);
}

async function restartAllServices() {
  stopAllServices();
  await new Promise(r => setTimeout(r, 2000));
  showBanner();
  showServiceInfo();
  await startAllServices();
}

async function showHealthStatus() {
  console.log(`\n${c.cyan}${c.bold}🏥 Health Check${c.reset}\n`);

  for (const [_key, service] of Object.entries(services)) {
    const isHealthy = await checkHealth(service.healthUrl);
    const status = isHealthy
      ? `${c.brightGreen}● HEALTHY${c.reset}`
      : `${c.brightRed}● DOWN${c.reset}`;

    console.log(`   ${service.icon} ${c.bold}${service.name}${c.reset}  ${status}  ${c.dim}${service.url}${c.reset}`);
  }

  console.log();
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

function showKeyboardHelp() {
  console.log(`
${c.cyan}${c.bold}⌨ Keyboard Shortcuts${c.reset}
${c.gray}─────────────────────────────────────${c.reset}
  ${c.yellow}h${c.reset}  Health check     ${c.yellow}r${c.reset}  Restart all
  ${c.yellow}c${c.reset}  Clear screen     ${c.yellow}s${c.reset}  Show status
  ${c.yellow}q${c.reset}  Quit             ${c.yellow}?${c.reset}  Show help
${c.gray}─────────────────────────────────────${c.reset}
`);
}

function showQuickStatus() {
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });
  const webStatus = serviceStatus.get('web') || 'unknown';
  const funcsStatus = serviceStatus.get('funcs') || 'unknown';

  const webIcon = webStatus === 'ready' ? `${c.brightGreen}●${c.reset}` : `${c.yellow}○${c.reset}`;
  const funcsIcon = funcsStatus === 'ready' ? `${c.brightGreen}●${c.reset}` : `${c.yellow}○${c.reset}`;

  console.log(`\n${c.dim}[${now}]${c.reset} ${webIcon} WEB  ${funcsIcon} FNC\n`);
}

function setupInputHandler() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', async (key) => {
      // Ctrl+C
      if (key === '\u0003') {
        stopAllServices();
        process.exit(0);
      }

      // 'r' - restart
      if (key === 'r' || key === 'R') {
        await restartAllServices();
      }

      // 'h' - health
      if (key === 'h' || key === 'H') {
        await showHealthStatus();
      }

      // 'c' - clear
      if (key === 'c' || key === 'C') {
        showBanner();
        showServiceInfo();
      }

      // 's' - status
      if (key === 's' || key === 'S') {
        showQuickStatus();
      }

      // '?' - help
      if (key === '?') {
        showKeyboardHelp();
      }

      // 'q' - quit
      if (key === 'q' || key === 'Q') {
        stopAllServices();
        process.exit(0);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  showBanner();
  showServiceInfo();
  setupInputHandler();

  // Handle termination
  process.on('SIGINT', () => {
    stopAllServices();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopAllServices();
    process.exit(0);
  });

  // Clean up ports and lock files before starting
  await prepareEnvironment();

  await startAllServices();
}

main().catch((error) => {
  console.error(`${c.red}Fatal error: ${error.message}${c.reset}`);
  process.exit(1);
});
