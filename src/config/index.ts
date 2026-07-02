import { z } from 'zod';
import { parseBoolean, parseCsv, parseJsonStringArray, parseNumber } from '../utils/env.js';
import type { PermissionStrategy, VerboseMode } from '../types/agent.js';

const oneBotModeSchema = z.enum(['forward', 'reverse']);
const progressModeSchema = z.enum(['off', 'message']);
const verboseModeSchema = z.enum(['normal', 'verbose', 'debug']);
const permissionStrategySchema = z.enum(['allow_once', 'allow_always', 'cancel']);

export interface AppConfig {
  server: {
    host: string;
    port: number;
  };
  storage: {
    dataDir: string;
    sessionFilePath: string;
    sessionTtlMs: number;
  };
  onebot: {
    mode: 'forward' | 'reverse';
    accessToken?: string;
    forwardWsUrl: string;
    reverseWsHost: string;
    reverseWsPort: number;
    reverseWsPath: string;
    requireMentionInGroup: boolean;
    allowPrivate: boolean;
    allowedGroups: string[];
    allowedUsers: string[];
    progressMode: 'off' | 'message';
    outboundMaxTextLength: number;
  };
  ai: {
    agentCommand: string;
    agentArgs: string[];
    workdir: string;
    clientName: string;
    reuseSession: boolean;
    verboseMode: VerboseMode;
    permissionStrategy: PermissionStrategy;
    progressThrottleMs: number;
    maxProgressUpdates: number;
    maxInboundImages: number;
    maxInboundImageBytes: number;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const dataDir = env.DATA_DIR || './data';

  return {
    server: {
      host: env.BOT_HOST || '0.0.0.0',
      port: parseNumber(env.BOT_PORT, 8080),
    },
    storage: {
      dataDir,
      sessionFilePath: env.SESSION_FILE_PATH || `${dataDir}/sessions.json`,
      sessionTtlMs: parseNumber(env.SESSION_TTL_MINUTES, 120) * 60 * 1000,
    },
    onebot: {
      mode: oneBotModeSchema.parse(env.ONEBOT_MODE || 'reverse'),
      accessToken: env.ONEBOT_ACCESS_TOKEN || undefined,
      forwardWsUrl: env.ONEBOT_FORWARD_WS_URL || 'ws://127.0.0.1:3001/onebot/v11/ws',
      reverseWsHost: env.ONEBOT_REVERSE_WS_HOST || '0.0.0.0',
      reverseWsPort: parseNumber(env.ONEBOT_REVERSE_WS_PORT, 6700),
      reverseWsPath: env.ONEBOT_REVERSE_WS_PATH || '/onebot/v11/ws',
      requireMentionInGroup: parseBoolean(env.ONEBOT_REQUIRE_MENTION_IN_GROUP, true),
      allowPrivate: parseBoolean(env.ONEBOT_ALLOW_PRIVATE, true),
      allowedGroups: parseCsv(env.ONEBOT_ALLOWED_GROUPS),
      allowedUsers: parseCsv(env.ONEBOT_ALLOWED_USERS),
      progressMode: progressModeSchema.parse(env.ONEBOT_PROGRESS_MODE || 'message'),
      outboundMaxTextLength: parseNumber(env.ONEBOT_OUTBOUND_MAX_TEXT_LENGTH, 1400),
    },
    ai: {
      agentCommand: env.ACP_AGENT_COMMAND || 'codex',
      agentArgs: parseJsonStringArray(env.ACP_AGENT_ARGS_JSON, []),
      workdir: env.ACP_AGENT_WORKDIR || process.cwd(),
      clientName: env.ACP_CLIENT_NAME || 'qq-ai-bot',
      reuseSession: parseBoolean(env.ACP_REUSE_SESSION, true),
      verboseMode: verboseModeSchema.parse(env.ACP_VERBOSE_MODE || 'verbose'),
      permissionStrategy: permissionStrategySchema.parse(
        (env.ACP_PERMISSION_STRATEGY || 'allow_once') as PermissionStrategy,
      ),
      progressThrottleMs: parseNumber(env.ACP_PROGRESS_THROTTLE_MS, 800),
      maxProgressUpdates: parseNumber(env.ACP_MAX_PROGRESS_UPDATES, 6),
      maxInboundImages: parseNumber(env.ACP_MAX_INBOUND_IMAGES, 3),
      maxInboundImageBytes: parseNumber(env.ACP_MAX_INBOUND_IMAGE_BYTES, 6 * 1024 * 1024),
    },
  };
}
