import type { Logger } from 'pino';
import type { AppConfig } from '../config/index.js';
import { FileSessionStore } from './file-session-store.js';
import { RedisSessionStore } from './redis-session-store.js';
import type { SessionStore } from './session-store.js';

export function createSessionStore(config: AppConfig, logger: Logger): SessionStore {
  if (config.storage.sessionStore === 'redis') {
    if (!config.storage.redisUrl) {
      throw new Error('SESSION_STORE=redis requires REDIS_URL');
    }
    return new RedisSessionStore(
      config.storage.redisUrl,
      config.storage.redisKeyPrefix,
      config.storage.sessionTtlMs,
      logger.child({ store: 'redis' }),
    );
  }

  return new FileSessionStore(
    config.storage.sessionFilePath,
    config.storage.sessionTtlMs,
    logger.child({ store: 'file' }),
  );
}
