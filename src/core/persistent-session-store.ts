import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Logger } from 'pino';
import type { PersistedConversationState } from '../types/session.js';

export class PersistentSessionStore {
  private readonly records = new Map<string, PersistedConversationState>();

  constructor(
    private readonly filePath: string,
    private readonly logger: Logger,
  ) {}

  async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as PersistedConversationState[];
      this.records.clear();
      for (const record of parsed) {
        if (!record || typeof record.conversationKey !== 'string') {
          continue;
        }
        this.records.set(record.conversationKey, record);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      this.logger.warn(
        { error: error instanceof Error ? error.message : String(error), filePath: this.filePath },
        'failed to load persisted session store',
      );
    }
  }

  get(conversationKey: string): PersistedConversationState | undefined {
    return this.records.get(conversationKey);
  }

  list(): PersistedConversationState[] {
    return [...this.records.values()];
  }

  async upsert(record: PersistedConversationState): Promise<void> {
    this.records.set(record.conversationKey, record);
    await this.flush();
  }

  async delete(conversationKey: string): Promise<void> {
    this.records.delete(conversationKey);
    await this.flush();
  }

  async clearExpired(now: number, ttlMs: number): Promise<string[]> {
    const removed: string[] = [];
    for (const [key, record] of this.records.entries()) {
      const lastActivityAt = Date.parse(record.lastActivityAt);
      if (!Number.isFinite(lastActivityAt)) {
        this.records.delete(key);
        removed.push(key);
        continue;
      }
      if (now - lastActivityAt > ttlMs) {
        this.records.delete(key);
        removed.push(key);
      }
    }
    if (removed.length > 0) {
      await this.flush();
    }
    return removed;
  }

  private async flush(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const sorted = [...this.records.values()].sort((a, b) => a.conversationKey.localeCompare(b.conversationKey));
    await writeFile(this.filePath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  }
}
