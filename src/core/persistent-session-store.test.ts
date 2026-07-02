import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PersistentSessionStore } from './persistent-session-store.js';
import { logger } from '../infra/logger.js';

describe('PersistentSessionStore', () => {
  it('persists and reloads sessions', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'qq-ai-bot-'));
    const filePath = path.join(dir, 'sessions.json');
    const store = new PersistentSessionStore(filePath, logger);

    await store.upsert({
      conversationKey: 'direct:1',
      chatType: 'direct',
      targetId: '1',
      remoteSessionId: 'remote-1',
      lastActivityAt: new Date().toISOString(),
    });

    const reloaded = new PersistentSessionStore(filePath, logger);
    await reloaded.load();
    expect(reloaded.get('direct:1')?.remoteSessionId).toBe('remote-1');

    const raw = JSON.parse(await readFile(filePath, 'utf8')) as Array<{ conversationKey: string }>;
    expect(raw[0]?.conversationKey).toBe('direct:1');
  });
});
