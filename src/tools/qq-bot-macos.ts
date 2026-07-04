import { execFile as execFileCallback, spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildNapcatLoader } from './napcat-loader.js';

const execFile = promisify(execFileCallback);

const DEFAULT_BOT_PORT = 18080;
const DEFAULT_ONEBOT_PORT = 16700;
const DEFAULT_WS_PATH = '/onebot/v11/ws';
const DEFAULT_ACCESS_TOKEN = 'test-token';
const DEFAULT_WEBUI_TOKEN = 'qq-ai-bot';
const DEFAULT_GROUP_CONFIG = './examples/group-rules.example.json';
const DEFAULT_AGENT_COMMAND = '/Users/bytedance/.local/bin/traex';
const DEFAULT_AGENT_ARGS = ['acp', 'serve'];
const DEFAULT_AGENT_WORKDIR = '/Users/bytedance/GolandProjects/DevPlan';
const DEFAULT_QQ_APP = '/Applications/QQ.app';

type Command = 'status' | 'repair' | 'login' | 'up';

interface CliOptions {
  command: Command;
  qqApp: string;
  quickAccount?: string;
}

interface DerivedPaths {
  repoRoot: string;
  qqResourcesDir: string;
  qqPackagePath: string;
  qqBackupPath: string;
  qqDocumentsDir: string;
  napcatShellDir: string;
  napcatLoaderPath: string;
  napcatConfigDir: string;
  webuiConfigPath: string;
  onebotConfigPath: string;
  napcatConfigPath: string;
  botLogPath: string;
  botPidPath: string;
}

function parseArgs(argv: string[]): CliOptions {
  const [commandArg, ...rest] = argv;
  const command = (commandArg ?? 'status') as Command;
  if (!['status', 'repair', 'login', 'up'].includes(command)) {
    throw new Error(`unknown command: ${commandArg ?? ''}`);
  }

  const options: CliOptions = {
    command,
    qqApp: DEFAULT_QQ_APP,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index];
    switch (current) {
      case '--qq-app':
        options.qqApp = rest[++index] ?? options.qqApp;
        break;
      case '--quick-account':
        options.quickAccount = rest[++index] ?? options.quickAccount;
        break;
      default:
        throw new Error(`unknown argument: ${current}`);
    }
  }

  return options;
}

function repoRootOf(): string {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
}

function derivePaths(repoRoot: string, qqApp: string): DerivedPaths {
  const home = os.homedir();
  const qqResourcesDir = path.join(qqApp, 'Contents', 'Resources', 'app');
  const qqPackagePath = path.join(qqResourcesDir, 'package.json');
  const qqDocumentsDir = path.join(home, 'Library', 'Containers', 'com.tencent.qq', 'Data', 'Documents');
  const napcatShellDir = path.join(qqDocumentsDir, 'napcat');
  const napcatLoaderPath = path.join(qqDocumentsDir, 'loadNapCat.js');
  const napcatConfigDir = path.join(
    home,
    'Library',
    'Containers',
    'com.tencent.qq',
    'Data',
    'Library',
    'Application Support',
    'QQ',
    'NapCat',
    'config',
  );

  return {
    repoRoot,
    qqResourcesDir,
    qqPackagePath,
    qqBackupPath: `${qqPackagePath}.qq-ai-bot.bak`,
    qqDocumentsDir,
    napcatShellDir,
    napcatLoaderPath,
    napcatConfigDir,
    webuiConfigPath: path.join(napcatConfigDir, 'webui.json'),
    onebotConfigPath: path.join(napcatConfigDir, 'onebot11.json'),
    napcatConfigPath: path.join(napcatConfigDir, 'napcat.json'),
    botLogPath: path.join(repoRoot, 'run-logs', 'bot.log'),
    botPidPath: path.join(repoRoot, 'run-logs', 'bot.pid'),
  };
}

async function readJson(target: string): Promise<Record<string, unknown> | undefined> {
  if (!existsSync(target)) {
    return undefined;
  }
  return JSON.parse(await readFile(target, 'utf8')) as Record<string, unknown>;
}

async function writeJson(target: string, data: Record<string, unknown>): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function ensureNapcatPatched(paths: DerivedPaths, quickAccount?: string): Promise<void> {
  const packageJson = (await readJson(paths.qqPackagePath)) ?? {};
  const expectedMain = path.relative(paths.qqResourcesDir, paths.napcatLoaderPath).split(path.sep).join(path.posix.sep);
  packageJson.main = expectedMain;
  await writeFile(paths.qqPackagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
  await writeFile(
    paths.napcatLoaderPath,
    buildNapcatLoader(
      {
        qqPackagePath: paths.qqPackagePath,
        qqResourcesDir: paths.qqResourcesDir,
        napcatShellDir: paths.napcatShellDir,
      },
      { quickAccount },
    ),
    'utf8',
  );

  await writeJson(paths.webuiConfigPath, {
    host: '127.0.0.1',
    port: 6099,
    prefix: '',
    token: DEFAULT_WEBUI_TOKEN,
    loginRate: 3,
    accessControlMode: 'none',
    ipWhitelist: [],
    ipBlacklist: [],
    enableXForwardedFor: false,
  });
  await writeJson(paths.onebotConfigPath, {
    network: {
      httpServers: [],
      httpSseServers: [],
      httpClients: [],
      websocketServers: [],
      websocketClients: [
        {
          enable: true,
          name: 'qq-ai-bot-reverse-ws',
          url: `ws://127.0.0.1:${DEFAULT_ONEBOT_PORT}${DEFAULT_WS_PATH}`,
          messagePostFormat: 'array',
          reportSelfMessage: false,
          reconnectInterval: 2000,
          token: DEFAULT_ACCESS_TOKEN,
          debug: false,
          heartInterval: 30000,
          verifyCertificate: true,
        },
      ],
      plugins: [],
    },
    musicSignUrl: '',
    enableLocalFile2Url: false,
    parseMultMsg: false,
    imageDownloadProxy: '',
    timeout: {
      baseTimeout: 10000,
      uploadSpeedKBps: 256,
      downloadSpeedKBps: 256,
      maxTimeout: 1800000,
    },
  });
  await writeJson(paths.napcatConfigPath, {
    fileLog: false,
    consoleLog: true,
    fileLogLevel: 'debug',
    consoleLogLevel: 'info',
    packetBackend: 'auto',
    packetServer: '',
    o3HookMode: 1,
    bypass: {
      hook: false,
      window: false,
      module: false,
      process: false,
      container: false,
      js: false,
    },
  });
}

async function stopQQ(): Promise<void> {
  await execFile('osascript', ['-e', 'tell application "QQ" to quit']).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await execFile('pkill', ['-f', '/Applications/QQ.app/Contents/MacOS/QQ']).catch(() => undefined);
}

async function launchQQ(qqApp: string): Promise<void> {
  const child = spawn('open', ['-na', qqApp, '--args', '--napcat-shell'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function stopBot(paths: DerivedPaths): Promise<void> {
  const pidText = existsSync(paths.botPidPath) ? await readFile(paths.botPidPath, 'utf8') : '';
  const pid = Number(pidText.trim());
  if (Number.isFinite(pid) && pid > 0) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
  await execFile('pkill', ['-f', 'node dist/index.js']).catch(() => undefined);
}

async function startBot(paths: DerivedPaths): Promise<void> {
  await mkdir(path.dirname(paths.botLogPath), { recursive: true });
  const child = spawn('node', ['dist/index.js'], {
    cwd: paths.repoRoot,
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'],
    env: {
      ...process.env,
      BOT_PORT: String(DEFAULT_BOT_PORT),
      ONEBOT_MODE: 'reverse',
      ONEBOT_REVERSE_WS_PORT: String(DEFAULT_ONEBOT_PORT),
      ONEBOT_REVERSE_WS_PATH: DEFAULT_WS_PATH,
      ONEBOT_ACCESS_TOKEN: DEFAULT_ACCESS_TOKEN,
      ONEBOT_ALLOW_GROUP: 'true',
      ONEBOT_REQUIRE_MENTION_IN_GROUP: 'true',
      ONEBOT_ALLOW_PRIVATE: 'true',
      ONEBOT_ALLOW_GROUP_COMMANDS_WITHOUT_MENTION: 'false',
      ONEBOT_COMMAND_PREFIX: '/',
      ONEBOT_GROUP_CONFIG_FILE: path.join(paths.repoRoot, DEFAULT_GROUP_CONFIG.replace(/^\.\//, '')),
      ACP_AGENT_COMMAND: DEFAULT_AGENT_COMMAND,
      ACP_AGENT_ARGS_JSON: JSON.stringify(DEFAULT_AGENT_ARGS),
      ACP_AGENT_WORKDIR: DEFAULT_AGENT_WORKDIR,
      ACP_VERBOSE_MODE: 'verbose',
      ACP_PERMISSION_STRATEGY: 'allow_once',
      ACP_PROGRESS_THROTTLE_MS: '500',
      ACP_MAX_PROGRESS_UPDATES: '10',
    },
  });
  child.unref();
  await writeFile(paths.botPidPath, `${child.pid}\n`, 'utf8');
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function napcatCredential(): Promise<string | null> {
  try {
    const hashed = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${DEFAULT_WEBUI_TOKEN}.napcat`));
    const hash = Buffer.from(hashed).toString('hex');
    const response = await fetch('http://127.0.0.1:6099/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { data?: { Credential?: string } };
    return body.data?.Credential ?? null;
  } catch {
    return null;
  }
}

async function fetchNapcatStatus(): Promise<Record<string, unknown> | null> {
  const credential = await napcatCredential();
  if (!credential) {
    return null;
  }
  try {
    const response = await fetch('http://127.0.0.1:6099/api/QQLogin/CheckLoginStatus', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${credential}`,
        'content-type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchNapcatLoginInfo(): Promise<Record<string, unknown> | null> {
  const credential = await napcatCredential();
  if (!credential) {
    return null;
  }
  try {
    const response = await fetch('http://127.0.0.1:6099/api/QQLogin/GetQQLoginInfo', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${credential}`,
        'content-type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function refreshQrCode(): Promise<string | null> {
  const credential = await napcatCredential();
  if (!credential) {
    return null;
  }
  const headers = {
    authorization: `Bearer ${credential}`,
    'content-type': 'application/json',
  };
  try {
    await fetch('http://127.0.0.1:6099/api/QQLogin/SetQuickLoginQQ', {
      method: 'POST',
      headers,
      body: JSON.stringify({ uin: '' }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => undefined);

    await fetch('http://127.0.0.1:6099/api/QQLogin/RefreshQRcode', {
      method: 'POST',
      headers,
      body: '{}',
      signal: AbortSignal.timeout(3000),
    }).catch(() => undefined);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch('http://127.0.0.1:6099/api/QQLogin/GetQQLoginQrcode', {
        method: 'POST',
        headers,
        body: '{}',
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);
      if (response?.ok) {
        const body = (await response.json()) as { data?: { qrcode?: string } };
        const qr = body.data?.qrcode;
        if (qr) {
          return qr;
        }
      }

      const status = await fetchNapcatStatus();
      const qrFromStatus = (status?.data as { qrcodeurl?: string } | undefined)?.qrcodeurl;
      if (qrFromStatus) {
        return qrFromStatus;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch {
    return null;
  }
  return null;
}

async function commandStatus(): Promise<void> {
  const botStatus = await fetchJson(`http://127.0.0.1:${DEFAULT_BOT_PORT}/status`);
  const napcatStatus = await fetchNapcatStatus();
  console.log(
    JSON.stringify(
      {
        botStatus,
        napcatStatus,
      },
      null,
      2,
    ),
  );
}

async function commandRepair(paths: DerivedPaths, options: CliOptions): Promise<void> {
  await ensureNapcatPatched(paths, options.quickAccount);
  await stopBot(paths);
  await startBot(paths);
  console.log(JSON.stringify({ ok: true, repaired: true }, null, 2));
}

async function commandLogin(paths: DerivedPaths): Promise<void> {
  const loginStatus = await fetchNapcatStatus();
  const loginInfo = await fetchNapcatLoginInfo();
  const isLogin = (loginStatus?.data as { isLogin?: boolean } | undefined)?.isLogin === true;
  if (isLogin) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          alreadyLoggedIn: true,
          loginStatus,
          loginInfo,
        },
        null,
        2,
      ),
    );
    return;
  }

  const qr = await refreshQrCode();
  if (!qr) {
    throw new Error('failed to get login qrcode');
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        alreadyLoggedIn: false,
        qrcodeUrl: qr,
        qrcodePng: path.join(paths.repoRoot, 'run-logs', 'qq-login-qr.png'),
      },
      null,
      2,
    ),
  );
}

async function commandUp(paths: DerivedPaths, options: CliOptions): Promise<void> {
  await ensureNapcatPatched(paths, options.quickAccount);
  await stopBot(paths);
  await stopQQ();
  await startBot(paths);
  await launchQQ(options.qqApp);
  await new Promise((resolve) => setTimeout(resolve, 10_000));

  let botStatus = await fetchJson(`http://127.0.0.1:${DEFAULT_BOT_PORT}/status`);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const connected =
      ((botStatus?.onebot as { connected?: boolean } | undefined)?.connected ?? false) === true;
    if (connected) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    botStatus = await fetchJson(`http://127.0.0.1:${DEFAULT_BOT_PORT}/status`);
  }

  const napcatStatus = await fetchNapcatStatus();
  const qr = napcatStatus && ((napcatStatus.data as { qrcodeurl?: string } | undefined)?.qrcodeurl as string | undefined);
  const loginInfo = await fetchNapcatLoginInfo();

  console.log(
    JSON.stringify(
      {
        ok: true,
        botStatus,
        napcatStatus,
        loginInfo,
        qrcodeUrl: qr || null,
      },
      null,
      2,
    ),
  );
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = repoRootOf();
  const paths = derivePaths(repoRoot, options.qqApp);

  switch (options.command) {
    case 'status':
      await commandStatus();
      return;
    case 'repair':
      await commandRepair(paths, options);
      return;
    case 'login':
      await commandLogin(paths);
      return;
    case 'up':
      await commandUp(paths, options);
      return;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
