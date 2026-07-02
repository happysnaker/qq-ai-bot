import { describe, expect, it } from 'vitest';
import { OneBotGateway } from './client.js';
import { logger } from '../../infra/logger.js';
import { loadConfig } from '../../config/index.js';

function createGateway() {
  const config = loadConfig({
    ONEBOT_MODE: 'forward',
    ONEBOT_FORWARD_WS_URL: 'ws://127.0.0.1:3001/onebot/v11/ws',
    ONEBOT_OUTBOUND_MAX_TEXT_LENGTH: '120',
  });

  return new OneBotGateway(config, logger.child({ test: 'onebot-gateway' }));
}

describe('OneBotGateway message segment building', () => {
  it('builds base64 image segments for outbound agent images', () => {
    const gateway = createGateway();
    const segments = (gateway as unknown as {
      buildMessageSegments: (params: {
        text?: string;
        image?: { kind: 'base64' | 'url'; value: string; mimeType?: string };
        replyToId?: string;
      }) => string | Array<Record<string, unknown>>;
    }).buildMessageSegments({
      replyToId: '123',
      image: {
        kind: 'base64',
        value: 'ZmFrZS1wbmc=',
        mimeType: 'image/png',
      },
    });

    expect(segments).toEqual([
      { type: 'reply', data: { id: '123' } },
      { type: 'image', data: { file: 'base64://ZmFrZS1wbmc=' } },
    ]);
  });

  it('returns plain text when only text is present and no reply is needed', () => {
    const gateway = createGateway();
    const message = (gateway as unknown as {
      buildMessageSegments: (params: {
        text?: string;
        image?: { kind: 'base64' | 'url'; value: string; mimeType?: string };
        replyToId?: string;
      }) => string | Array<Record<string, unknown>>;
    }).buildMessageSegments({
      text: '你好',
    });

    expect(message).toBe('你好');
  });
});
