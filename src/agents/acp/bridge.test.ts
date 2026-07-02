import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../config/index.js';
import { logger } from '../../infra/logger.js';
import { ACPAgentBridge } from './bridge.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function createBridge(): ACPAgentBridge {
  process.env.ACP_AGENT_COMMAND = process.execPath;
  process.env.ACP_AGENT_ARGS_JSON = JSON.stringify(['--import', 'tsx', 'src/examples/mock-acp-agent.ts']);
  process.env.ACP_AGENT_WORKDIR = repoRoot;
  process.env.ACP_VERBOSE_MODE = 'verbose';

  const config = loadConfig(process.env);
  return new ACPAgentBridge(config, logger.child({ test: 'acp-bridge-image' }));
}

describe('ACPAgentBridge image outputs', () => {
  it('returns ACP image chunks together with text', async () => {
    const bridge = createBridge();

    try {
      const response = await bridge.sendPrompt({
        text: '请给我一张图',
      });

      expect(response.text).toContain('【Mock Agent】收到');
      expect(response.images).toEqual([
        {
          mimeType: 'image/png',
          base64Data: 'ZmFrZS1vdXRwdXQtaW1hZ2U=',
          uri: 'https://example.com/mock-output.png',
        },
      ]);
    } finally {
      await bridge.stop();
    }
  });
});
