import type { Logger } from 'pino';
import type { AppConfig } from '../config/index.js';
import { ACPAgentBridge } from '../agents/acp/bridge.js';
import type { PersistedConversationState, RuntimeConversationMeta } from '../types/session.js';
import type { SessionStore } from './session-store.js';

interface ConversationRuntime extends RuntimeConversationMeta {
  bridge: ACPAgentBridge;
  lastActivityAt: number;
}

export class ConversationManager {
  private readonly runtimes = new Map<string, ConversationRuntime>();
  private readonly persistedRecords = new Map<string, PersistedConversationState>();

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly store: SessionStore,
    private readonly hooks?: {
      onAcpPromptStarted?: () => void;
      onAcpPromptFailed?: () => void;
    },
  ) {}

  async load(): Promise<void> {
    await this.store.load();
    const records = await this.store.list();
    this.persistedRecords.clear();
    for (const record of records) {
      this.persistedRecords.set(record.conversationKey, record);
    }
  }

  listPersisted(): PersistedConversationState[] {
    return [...this.persistedRecords.values()].sort((a, b) => a.conversationKey.localeCompare(b.conversationKey));
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
    return this.persistedRecords.get(conversationKey);
  }

  getOrCreate(meta: RuntimeConversationMeta): ConversationRuntime {
    const existing = this.runtimes.get(meta.conversationKey);
    if (existing) {
      existing.lastActivityAt = Date.now();
      return existing;
    }

    const runtime: ConversationRuntime = {
      ...meta,
      bridge: new ACPAgentBridge(
        this.config,
        this.logger.child({ conversationKey: meta.conversationKey }),
        {
          onPromptStarted: () => this.hooks?.onAcpPromptStarted?.(),
          onPromptFailed: () => this.hooks?.onAcpPromptFailed?.(),
        },
      ),
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
    const record: PersistedConversationState = {
      conversationKey: runtime.conversationKey,
      chatType: runtime.chatType,
      targetId: runtime.targetId,
      remoteSessionId: this.config.ai.reuseSession ? runtime.bridge.getSessionId() : undefined,
      lastActivityAt: new Date(runtime.lastActivityAt).toISOString(),
    };
    await this.store.upsert(record);
    this.persistedRecords.set(record.conversationKey, record);
  }

  async reset(conversationKey: string): Promise<void> {
    const runtime = this.runtimes.get(conversationKey);
    if (runtime) {
      await runtime.bridge.stop();
      this.runtimes.delete(conversationKey);
    }
    await this.store.delete(conversationKey);
    this.persistedRecords.delete(conversationKey);
  }

  async cleanupExpired(): Promise<string[]> {
    const now = Date.now();
    const expiredKeys = await this.store.clearExpired(now);
    for (const key of expiredKeys) {
      this.persistedRecords.delete(key);
    }

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
    await this.store.close?.();
  }
}
