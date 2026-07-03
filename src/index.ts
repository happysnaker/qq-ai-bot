import { loadConfig } from './config/index.js';
import { logger } from './infra/logger.js';
import { BotApplication } from './core/app.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const app = new BotApplication(config, logger);
  await app.start();
  logger.info({}, '💛 如果这个项目帮你省了时间，欢迎支持: https://happysnaker.github.io/support/#from-qq-ai-bot (¥9.9起，微信/支付宝)');
}

main().catch((error) => {
  logger.error(
    { error: error instanceof Error ? error.stack || error.message : String(error) },
    'fatal error during startup',
  );
  process.exit(1);
});
