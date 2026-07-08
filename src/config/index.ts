import { readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { parseBoolean, parseCsv, parseNumber } from '../utils/env.js';
import { loadDotEnv } from '../infra/env-file.js';
import { resolveAcpAgentArgs } from '../utils/acp-agent.js';
import type { PermissionStrategy, VerboseMode } from '../types/agent.js';

const oneBotModeSchema = z.enum(['forward', 'reverse']);
const progressModeSchema = z.enum(['off', 'message']);
const verboseModeSchema = z.enum(['normal', 'verbose', 'debug']);
const permissionStrategySchema = z.enum(['allow_once', 'allow_always', 'cancel']);
const groupPolicySchema = z.object({
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  requireMention: z.boolean().optional(),
  systemPrompt: z.string().optional(),
});
const groupPolicyFileSchema = z.object({
  defaultSystemPrompt: z.string().optional(),
  groups: z.record(z.string(), groupPolicySchema).default({}),
});

export interface GroupConversationPolicy {
  id: string;
  name?: string;
  enabled?: boolean;
  requireMention?: boolean;
  systemPrompt?: string;
}

export interface AppConfig {
  server: {
    host: string;
    port: number;
  };
  storage: {
    sessionStore: 'file' | 'redis' | 'postgres';
    dataDir: string;
    sessionFilePath: string;
    sessionTtlMs: number;
    redisUrl?: string;
    redisKeyPrefix: string;
    postgresUrl?: string;
    postgresTable: string;
  };
  onebot: {
    mode: 'forward' | 'reverse';
    accessToken?: string;
    forwardWsUrl: string;
    reverseWsHost: string;
    reverseWsPort: number;
    reverseWsPath: string;
    allowGroup: boolean;
    requireMentionInGroup: boolean;
    allowPrivate: boolean;
    allowGroupCommandsWithoutMention: boolean;
    allowedGroups: string[];
    blockedGroups: string[];
    allowedUsers: string[];
    blockedUsers: string[];
    commandPrefix: string;
    progressMode: 'off' | 'message';
    outboundMaxTextLength: number;
    inboundDedupeWindowMs: number;
    inboundDedupeMaxEntries: number;
    defaultSystemPrompt?: string;
    groupConfigFilePath?: string;
    groupPolicies: Record<string, GroupConversationPolicy>;
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

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeGroupPolicy(
  id: string,
  value: z.infer<typeof groupPolicySchema>,
): GroupConversationPolicy {
  return {
    id,
    name: normalizeOptionalText(value.name),
    enabled: value.enabled,
    requireMention: value.requireMention,
    systemPrompt: normalizeOptionalText(value.systemPrompt),
  };
}

function loadGroupPolicyFile(filePath: string | undefined): {
  groupConfigFilePath?: string;
  defaultSystemPrompt?: string;
  groupPolicies: Record<string, GroupConversationPolicy>;
} {
  const normalizedFilePath = normalizeOptionalText(filePath);
  if (!normalizedFilePath) {
    return {
      groupPolicies: {},
    };
  }

  const resolvedPath = path.resolve(normalizedFilePath);
  let fileContent: string;
  try {
    fileContent = readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(
      `failed to read ONEBOT_GROUP_CONFIG_FILE at ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    );
  }

  try {
    const parsed = groupPolicyFileSchema.parse(JSON.parse(fileContent));
    const groupPolicies = Object.fromEntries(
      Object.entries(parsed.groups).map(([groupId, value]) => [groupId, normalizeGroupPolicy(groupId, value)]),
    );
    return {
      groupConfigFilePath: resolvedPath,
      defaultSystemPrompt: normalizeOptionalText(parsed.defaultSystemPrompt),
      groupPolicies,
    };
  } catch (error) {
    throw new Error(
      `failed to parse ONEBOT_GROUP_CONFIG_FILE at ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    );
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (env === process.env) {
    loadDotEnv();
  }
  const dataDir = env.DATA_DIR || './data';
  const groupPolicyFile = loadGroupPolicyFile(env.ONEBOT_GROUP_CONFIG_FILE);
  const defaultSystemPrompt =
    normalizeOptionalText(env.ACP_DEFAULT_SYSTEM_PROMPT) ?? groupPolicyFile.defaultSystemPrompt;
  const commandPrefix = normalizeOptionalText(env.ONEBOT_COMMAND_PREFIX) || '/';
  const sessionStore = z.enum(['file', 'redis', 'postgres']).parse(env.SESSION_STORE || 'file');

  return {
    server: {
      host: env.BOT_HOST || '0.0.0.0',
      port: parseNumber(env.BOT_PORT, 8080),
    },
    storage: {
      sessionStore,
      dataDir,
      sessionFilePath: env.SESSION_FILE_PATH || `${dataDir}/sessions.json`,
      sessionTtlMs: parseNumber(env.SESSION_TTL_MINUTES, 120) * 60 * 1000,
      redisUrl: normalizeOptionalText(env.REDIS_URL),
      redisKeyPrefix: normalizeOptionalText(env.REDIS_KEY_PREFIX) || 'qq-ai-bot',
      postgresUrl: normalizeOptionalText(env.POSTGRES_URL),
      postgresTable: normalizeOptionalText(env.POSTGRES_TABLE) || 'qq_ai_bot_sessions',
    },
    onebot: {
      mode: oneBotModeSchema.parse(env.ONEBOT_MODE || 'reverse'),
      accessToken: env.ONEBOT_ACCESS_TOKEN || undefined,
      forwardWsUrl: env.ONEBOT_FORWARD_WS_URL || 'ws://127.0.0.1:3001/onebot/v11/ws',
      reverseWsHost: env.ONEBOT_REVERSE_WS_HOST || '0.0.0.0',
      reverseWsPort: parseNumber(env.ONEBOT_REVERSE_WS_PORT, 16700),
      reverseWsPath: env.ONEBOT_REVERSE_WS_PATH || '/onebot/v11/ws',
      allowGroup: parseBoolean(env.ONEBOT_ALLOW_GROUP, true),
      requireMentionInGroup: parseBoolean(env.ONEBOT_REQUIRE_MENTION_IN_GROUP, true),
      allowPrivate: parseBoolean(env.ONEBOT_ALLOW_PRIVATE, true),
      allowGroupCommandsWithoutMention: parseBoolean(env.ONEBOT_ALLOW_GROUP_COMMANDS_WITHOUT_MENTION, false),
      allowedGroups: parseCsv(env.ONEBOT_ALLOWED_GROUPS),
      blockedGroups: parseCsv(env.ONEBOT_BLOCKED_GROUPS),
      allowedUsers: parseCsv(env.ONEBOT_ALLOWED_USERS),
      blockedUsers: parseCsv(env.ONEBOT_BLOCKED_USERS),
      commandPrefix,
      progressMode: progressModeSchema.parse(env.ONEBOT_PROGRESS_MODE || 'message'),
      outboundMaxTextLength: parseNumber(env.ONEBOT_OUTBOUND_MAX_TEXT_LENGTH, 1400),
      inboundDedupeWindowMs: parseNumber(env.ONEBOT_INBOUND_DEDUPE_WINDOW_MS, 120_000),
      inboundDedupeMaxEntries: parseNumber(env.ONEBOT_INBOUND_DEDUPE_MAX_ENTRIES, 2048),
      defaultSystemPrompt,
      groupConfigFilePath: groupPolicyFile.groupConfigFilePath,
      groupPolicies: groupPolicyFile.groupPolicies,
    },
    ai: {
      agentCommand: env.ACP_AGENT_COMMAND || 'codex',
      agentArgs: resolveAcpAgentArgs(env.ACP_AGENT_ARGS_JSON, env.ACP_AGENT_COMMAND),
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
