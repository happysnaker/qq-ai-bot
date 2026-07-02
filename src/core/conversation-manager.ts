import type { Logger } from 'pino';
import type { AppConfig } from '../config/index.js';
import { ACPAgentBridge } from '../agents/acp/bridge.js';
import { PersistentSessionStore } from './persistent-session-store.js';
import type { PersistedConversationState, RuntimeConversationMeta } from '../types/session.js';

interface ConversationRuntime extends RuntimeConversationMeta {
  bridge: ACPAgentBridge;
  lastActivityAt: number;
}

export class ConversationManager {
  private readonly runtimes = new Map<string, ConversationRuntime>();

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly store: PersistentSessionStore,
  ) {}

  async load(): Promise<void> {
    await this.store.load();
  }

  listPersisted(): PersistedConversationState[] {
    return this.store.list();
  }

  listActive(): Array<{
    conversationKey: string;
    lastActivityAt: string;
    remoteSessionId?: string;
  }> {
    return [...this.runtimes.values()].map((runtime) => ({
      conversationKey: runtime.conversationKey,
      lastActivityAt: new Date(runtime.lastActivityAt).toISOString(),
      remoteSessionId: runtime.bridge.getSessionId(),
    }));
  }

  getPersisted(conversationKey: string): PersistedConversationState | undefined {
    return this.store.get(conversationKey);
  }

  getOrCreate(meta: RuntimeConversationMeta): ConversationRuntime {
    const existing = this.runtimes.get(meta.conversationKey);
    if (existing) {
      existing.lastActivityAt = Date.now();
      return existing;
    }

    const runtime: ConversationRuntime = {
      ...meta,
      bridge: new ACPAgentBridge(this.config, this.logger.child({ conversationKey: meta.conversationKey })),
      lastActivityAt: Date.now(),
    };
    this.runtimes.set(meta.conversationKey, runtime);
    return runtime;
  }

  async touch(meta: RuntimeConversationMeta): Promise<void> {
    const runtime = this.getOrCreate(meta);
    runtime.lastActivityAt = Date.now();
    await this.persistRuntime(runtime);
  }

  async persistRuntime(runtime: ConversationRuntime): Promise<void> {
    await this.store.upsert({
      conversationKey: runtime.conversationKey,
      chatType: runtime.chatType,
      targetId: runtime.targetId,
      remoteSessionId: this.config.ai.reuseSession ? runtime.bridge.getSessionId() : undefined,
      lastActivityAt: new Date(runtime.lastActivityAt).toISOString(),
    });
  }

  async reset(conversationKey: string): Promise<void> {
    const runtime = this.runtimes.get(conversationKey);
    if (runtime) {
      await runtime.bridge.stop();
      this.runtimes.delete(conversationKey);
    }
    await this.store.delete(conversationKey);
  }

  async cleanupExpired(): Promise<string[]> {
    const now = Date.now();
    const expiredKeys = await this.store.clearExpired(now, this.config.storage.sessionTtlMs);

    for (const [key, runtime] of this.runtimes.entries()) {
      if (now - runtime.lastActivityAt <= this.config.storage.sessionTtlMs) {
        continue;
      }
      await runtime.bridge.stop();
      this.runtimes.delete(key);
      if (!expiredKeys.includes(key)) {
        expiredKeys.push(key);
      }
    }

    if (expiredKeys.length > 0) {
      this.logger.info({ expiredKeys }, 'cleaned expired conversations');
    }
    return expiredKeys;
  }

  async stopAll(): Promise<void> {
    for (const runtime of this.runtimes.values()) {
      await runtime.bridge.stop();
    }
    this.runtimes.clear();
  }
}
