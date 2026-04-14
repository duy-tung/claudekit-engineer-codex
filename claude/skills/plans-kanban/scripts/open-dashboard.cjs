#!/usr/bin/env node

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const DEFAULT_PORT = 3456;
const PORT_CANDIDATES = [3456, 3457, 3458, 3459, 3460];
const DASHBOARD_URL = `http://localhost:${DEFAULT_PORT}/plans`;
const START_COMMAND = ['config', 'ui', '--port', String(DEFAULT_PORT), '--no-open'];
const PID_FILE = path.join(os.tmpdir(), 'plans-kanban-dashboard.pid');

function parseArgs(argv) {
  const args = {
    stop: false,
    deprecated: []
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    if (arg === '--open') {
      args.deprecated.push({ flag: '--open', detail: 'Opening is now the default behavior.' });
      continue;
    }

    if (arg === '--stop') {
      args.stop = true;
      args.deprecated.push({
        flag: '--stop',
        detail: 'The standalone plans-kanban server no longer exists. Stop the dashboard from the terminal running `ck config ui`.'
      });
      continue;
    }

    if ((arg === '--dir' || arg === '--plans' || arg === '--port' || arg === '--host') && next) {
      args.deprecated.push({ flag: `${arg} ${next}`, detail: getDeprecatedDetail(arg) });
      i += 1;
      continue;
    }

    if (arg === '--background' || arg === '--foreground') {
      args.deprecated.push({ flag: arg, detail: getDeprecatedDetail(arg) });
      continue;
    }

    if (!arg.startsWith('--')) {
      args.deprecated.push({
        flag: arg,
        detail: 'Positional plans paths are no longer used here. This launcher opens the generic /plans route and does not choose a custom plan root.'
      });
      continue;
    }

    args.deprecated.push({
      flag: arg,
      detail: 'This option is no longer supported by plans-kanban. Use `ck config ui --help` for dashboard runtime flags.'
    });
  }

  return args;
}

function getDeprecatedDetail(flag) {
  switch (flag) {
    case '--dir':
    case '--plans':
      return 'This launcher opens the generic /plans route. Directory selection is no longer handled here; use a scope-aware dashboard entry point or an explicit /plans?dir=... URL.';
    case '--port':
      return 'plans-kanban now targets the CLI dashboard starting at port 3456 and follows CLI auto-fallback ports.';
    case '--host':
      return 'Use `ck config ui --host <addr>` directly when you need non-localhost access.';
    case '--background':
    case '--foreground':
      return 'The launcher now uses a simple dashboard startup flow instead of managing a standalone server process.';
    default:
      return 'This flag belonged to the retired standalone server flow.';
  }
}

function printHelp() {
  console.log('plans-kanban launcher');
  console.log('');
  console.log('Opens the ClaudeKit CLI dashboard at:');
  console.log(`  ${DASHBOARD_URL}`);
  console.log('');
  console.log('If the dashboard is not running, this launcher starts:');
  console.log(`  ck ${START_COMMAND.join(' ')}`);
  console.log('');
  console.log('Legacy plans-kanban server flags are accepted with warnings for compatibility.');
}

function printDeprecatedWarnings(entries) {
  if (entries.length === 0) {
    return;
  }

  console.warn('\x1b[33m[plans-kanban]\x1b[0m Standalone server flags are deprecated. Opening the CLI dashboard instead.');
  for (const entry of entries) {
    console.warn(`  - ${entry.flag}: ${entry.detail}`);
  }
  console.warn('');
}

async function isDashboardRunningOnPort(port) {
  return new Promise((resolve) => {
    const request = http.get(`http://localhost:${port}/api/health`, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 300);
    });

    request.setTimeout(1200, () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => resolve(false));
  });
}

async function findRunningDashboardPort() {
  for (const port of PORT_CANDIDATES) {
    if (await isDashboardRunningOnPort(port)) {
      return port;
    }
  }
  return null;
}

function ensureCliExists() {
  try {
    execFileSync('ck', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function startDashboard() {
  const child = spawn('ck', START_COMMAND, {
    detached: true,
    stdio: 'ignore'
  });
  fs.writeFileSync(PID_FILE, String(child.pid));
  child.unref();
}

function stopDashboard() {
  if (!fs.existsSync(PID_FILE)) {
    return false;
  }

  const pid = Number.parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
  fs.rmSync(PID_FILE, { force: true });

  if (!Number.isFinite(pid)) {
    return false;
  }

  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

async function waitForDashboard(timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const port = await findRunningDashboardPort();
    if (port) {
      return port;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return null;
}

function openBrowser(url) {
  if (process.platform === 'darwin') {
    execFileSync('open', [url], { stdio: 'ignore' });
    return;
  }

  if (process.platform === 'win32') {
    const child = spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return;
  }

  execFileSync('xdg-open', [url], { stdio: 'ignore' });
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  printDeprecatedWarnings(args.deprecated);

  if (args.stop) {
    if (stopDashboard()) {
      console.log('Stopped the launcher-managed ClaudeKit dashboard process.');
    } else {
      console.log('No launcher-managed dashboard process was found.');
      console.log('If the dashboard was started manually, stop the terminal running `ck config ui`.');
    }
    return;
  }

  let dashboardPort = await findRunningDashboardPort();

  if (!dashboardPort) {
    if (!ensureCliExists()) {
      console.error('ClaudeKit CLI not found: `ck` is required to start the dashboard.');
      console.error(`Open ${DASHBOARD_URL} manually after starting \`ck ${START_COMMAND.join(' ')}\`.`);
      process.exitCode = 1;
      return;
    }

    console.log(`Starting ClaudeKit dashboard on http://localhost:${DEFAULT_PORT} ...`);
    startDashboard();
    dashboardPort = await waitForDashboard();
  }

  if (!dashboardPort) {
    console.error(`Dashboard did not become ready on ports ${PORT_CANDIDATES.join(', ')}.`);
    console.error(`Try running \`ck ${START_COMMAND.join(' ')}\` manually, then open ${DASHBOARD_URL}.`);
    process.exitCode = 1;
    return;
  }

  const dashboardUrl = `http://localhost:${dashboardPort}/plans`;
  console.log(`Opening ${dashboardUrl}`);
  try {
    openBrowser(dashboardUrl);
  } catch (error) {
    console.error(`Dashboard is running, but automatic browser open failed: ${error.message}`);
    console.error(`Open ${dashboardUrl} manually.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`plans-kanban launcher failed: ${error.message}`);
  process.exitCode = 1;
});
