import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocket } from 'ws';

const botPort = 18080;
const reverseWsPort = 16700;
const accessToken = 'test-token';

function bootBot(): ReturnType<typeof spawn> {
  return spawn(process.execPath, ['node_modules/.bin/tsx', 'src/index.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BOT_PORT: String(botPort),
      ONEBOT_MODE: 'reverse',
      ONEBOT_REVERSE_WS_PORT: String(reverseWsPort),
      ONEBOT_REVERSE_WS_PATH: '/onebot/v11/ws',
      ONEBOT_ACCESS_TOKEN: accessToken,
      ACP_AGENT_COMMAND: 'traecli',
      ACP_AGENT_ARGS_JSON: '["acp","serve"]',
      ACP_AGENT_WORKDIR: process.cwd(),
      ACP_VERBOSE_MODE: 'verbose',
      ACP_PERMISSION_STRATEGY: 'allow_once',
      ACP_PROGRESS_THROTTLE_MS: '300',
      ACP_MAX_PROGRESS_UPDATES: '10',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForBotReady(timeoutMs = 20_000): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${botPort}/healthz`);
      if (response.ok) {
        return;
      }
    } catch {
      // ignore
    }
    await delay(250);
  }

  throw new Error(`bot did not become healthy within ${timeoutMs}ms`);
}

async function runClient(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${reverseWsPort}/onebot/v11/ws`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('timed out waiting for final OneBot reply'));
    }, 60_000);

    socket.once('open', () => {
      console.log('CLIENT_CONNECTED');
      socket.send(
        JSON.stringify({
          post_type: 'message',
          message_type: 'private',
          user_id: 123456,
          self_id: 999999,
          message_id: 1,
          raw_message: '请只回复 E2E_OK',
          message: '请只回复 E2E_OK',
          sender: { user_id: 123456, nickname: 'tester' },
          time: Math.floor(Date.now() / 1000),
        }),
      );
    });

    socket.on('message', (data) => {
      const payload = JSON.parse(data.toString()) as {
        action?: string;
        params?: { message?: unknown };
        echo?: string;
      };
      console.log('BOT_OUT', JSON.stringify(payload));

      if (payload.action) {
        socket.send(
          JSON.stringify({
            status: 'ok',
            retcode: 0,
            data: { message_id: Date.now() },
            echo: payload.echo,
          }),
        );
      }

      if (payload.action === 'send_private_msg' || payload.action === 'send_group_msg') {
        const message = payload.params?.message;
        const flattened = typeof message === 'string' ? message : JSON.stringify(message);
        if (flattened.includes('E2E_OK')) {
          clearTimeout(timer);
          socket.close();
          resolve();
        }
      }
    });

    socket.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    socket.once('close', () => {
      clearTimeout(timer);
    });
  });
}

async function main(): Promise<void> {
  const bot = bootBot();
  let stdout = '';
  let stderr = '';
  let cleanupError: Error | null = null;

  bot.stdout?.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    stdout += text;
    process.stdout.write(text);
  });
  bot.stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    stderr += text;
    process.stderr.write(text);
  });

  try {
    await waitForBotReady();
    await runClient();
    console.log('E2E_OK');
  } finally {
    bot.kill('SIGINT');
    await Promise.race([once(bot, 'exit'), delay(5_000)]);
    if (bot.exitCode && bot.exitCode !== 0) {
      cleanupError = new Error(
        `bot exited with ${bot.exitCode}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`,
      );
    }
  }

  if (cleanupError) {
    throw cleanupError;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
