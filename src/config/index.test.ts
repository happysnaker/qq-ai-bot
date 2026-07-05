import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from './index.js';

describe('loadConfig', () => {
  it('parses relaxed ACP agent args and basic switches', () => {
    const config = loadConfig({
      ACP_AGENT_COMMAND: 'traex',
      ACP_AGENT_ARGS_JSON: '[acp,serve]',
      ONEBOT_ALLOW_GROUP: 'false',
      ONEBOT_ALLOW_PRIVATE: 'true',
      ONEBOT_COMMAND_PREFIX: '!',
      ACP_DEFAULT_SYSTEM_PROMPT: 'be precise',
    });

    expect(config.ai.agentArgs).toEqual(['acp', 'serve']);
    expect(config.onebot.allowGroup).toBe(false);
    expect(config.onebot.allowPrivate).toBe(true);
    expect(config.onebot.commandPrefix).toBe('!');
    expect(config.onebot.defaultSystemPrompt).toBe('be precise');
  });

  it('defaults reverse ws port and traex args to the quickstart values', () => {
    const config = loadConfig({
      ACP_AGENT_COMMAND: 'traex',
    });

    expect(config.onebot.reverseWsPort).toBe(16700);
    expect(config.ai.agentArgs).toEqual(['acp', 'serve']);
  });

  it('loads per-group prompt policies from json file', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'qq-ai-bot-config-'));
    const filePath = path.join(dir, 'group-rules.json');
    await writeFile(
      filePath,
      JSON.stringify(
        {
          defaultSystemPrompt: 'global prompt',
          groups: {
            '123': {
              name: '测试群',
              enabled: true,
              requireMention: false,
              systemPrompt: 'group prompt',
            },
            '456': {
              enabled: false,
            },
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    const config = loadConfig({
      ONEBOT_GROUP_CONFIG_FILE: filePath,
    });

    expect(config.onebot.groupConfigFilePath).toBe(path.resolve(filePath));
    expect(config.onebot.defaultSystemPrompt).toBe('global prompt');
    expect(config.onebot.groupPolicies['123']).toEqual({
      id: '123',
      name: '测试群',
      enabled: true,
      requireMention: false,
      systemPrompt: 'group prompt',
    });
    expect(config.onebot.groupPolicies['456']).toEqual({
      id: '456',
      name: undefined,
      enabled: false,
      requireMention: undefined,
      systemPrompt: undefined,
    });
  });

  it('supports redis session store config', () => {
    const config = loadConfig({
      SESSION_STORE: 'redis',
      REDIS_URL: 'redis://127.0.0.1:6379/0',
      REDIS_KEY_PREFIX: 'qq-ai-bot-prod',
      SESSION_TTL_MINUTES: '30',
    });

    expect(config.storage.sessionStore).toBe('redis');
    expect(config.storage.redisUrl).toBe('redis://127.0.0.1:6379/0');
    expect(config.storage.redisKeyPrefix).toBe('qq-ai-bot-prod');
    expect(config.storage.sessionTtlMs).toBe(30 * 60 * 1000);
  });

  it('supports inbound dedupe tuning config', () => {
    const config = loadConfig({
      ONEBOT_INBOUND_DEDUPE_WINDOW_MS: '45000',
      ONEBOT_INBOUND_DEDUPE_MAX_ENTRIES: '512',
    });

    expect(config.onebot.inboundDedupeWindowMs).toBe(45_000);
    expect(config.onebot.inboundDedupeMaxEntries).toBe(512);
  });
});
