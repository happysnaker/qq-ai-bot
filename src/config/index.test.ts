import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from './index.js';

describe('loadConfig', () => {
  it('parses relaxed ACP agent args and basic switches', () => {
    const config = loadConfig({
      ACP_AGENT_COMMAND: 'traecli',
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
});
