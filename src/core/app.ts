import process from 'node:process';
import type { Logger } from 'pino';
import type { AppConfig } from '../config/index.js';
import { OneBotGateway } from '../channels/onebot/client.js';
import { normalizeOneBotEvent } from '../channels/onebot/normalize.js';
import { downloadInboundImages } from './image-downloader.js';
import { ProgressReporter } from './progress-reporter.js';
import { PersistentSessionStore } from './persistent-session-store.js';
import { ConversationManager } from './conversation-manager.js';
import { AdminServer } from './admin-server.js';
import type { NormalizedOneBotEvent, OneBotReplyContext } from '../types/onebot.js';

function conversationKeyOf(event: NormalizedOneBotEvent): string {
  return `${event.mode}:${event.conversationId}`;
}

export class BotApplication {
  private readonly gateway: OneBotGateway;
  private readonly store: PersistentSessionStore;
  private readonly conversations: ConversationManager;
  private readonly adminServer: AdminServer;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {
    this.gateway = new OneBotGateway(config, logger.child({ component: 'onebot' }));
    this.store = new PersistentSessionStore(
      config.storage.sessionFilePath,
      logger.child({ component: 'session-store' }),
    );
    this.conversations = new ConversationManager(
      config,
      logger.child({ component: 'conversation-manager' }),
      this.store,
    );
    this.adminServer = new AdminServer({
      host: config.server.host,
      port: config.server.port,
      logger: logger.child({ component: 'admin-server' }),
      getStatus: () => this.getStatus(),
    });
  }

  async start(): Promise<void> {
    await this.conversations.load();
    await this.gateway.start(async (payload) => {
      await this.handleIncomingPayload(payload);
    });
    await this.adminServer.start();
    this.cleanupTimer = setInterval(() => {
      void this.conversations.cleanupExpired();
    }, Math.min(this.config.storage.sessionTtlMs, 10 * 60 * 1000));

    const shutdown = async (signal: string): Promise<void> => {
      this.logger.info({ signal }, 'received shutdown signal');
      await this.stop();
      process.exit(0);
    };

    process.once('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.once('SIGTERM', () => {
      void shutdown('SIGTERM');
    });

    this.logger.info(this.getStatus(), 'qq-ai-bot started');
  }

  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    await this.adminServer.stop();
    await this.gateway.stop();
    await this.conversations.stopAll();
  }

  getStatus(): Record<string, unknown> {
    return {
      ok: true,
      onebot: this.gateway.getStatus(),
      activeConversations: this.conversations.listActive(),
      persistedConversations: this.conversations.listPersisted().length,
      config: {
        onebotMode: this.config.onebot.mode,
        requireMentionInGroup: this.config.onebot.requireMentionInGroup,
        allowPrivate: this.config.onebot.allowPrivate,
        progressMode: this.config.onebot.progressMode,
        acpAgentCommand: this.config.ai.agentCommand,
        reuseSession: this.config.ai.reuseSession,
        verboseMode: this.config.ai.verboseMode,
      },
    };
  }

  private async handleIncomingPayload(payload: unknown): Promise<void> {
    const event = normalizeOneBotEvent(payload);
    if (!event) {
      return;
    }

    if (event.isSelfMessage) {
      return;
    }

    if (!this.isEventAllowed(event)) {
      return;
    }

    if (await this.handleCommand(event)) {
      return;
    }

    await this.processUserMessage(event);
  }

  private isEventAllowed(event: NormalizedOneBotEvent): boolean {
    if (event.mode === 'direct') {
      if (!this.config.onebot.allowPrivate) {
        return false;
      }
      if (this.config.onebot.allowedUsers.length > 0) {
        return this.config.onebot.allowedUsers.includes(event.senderId);
      }
      return true;
    }

    if (
      this.config.onebot.allowedGroups.length > 0 &&
      !this.config.onebot.allowedGroups.includes(event.conversationId)
    ) {
      return false;
    }
    if (this.config.onebot.requireMentionInGroup && !event.wasMentioned) {
      return false;
    }
    return true;
  }

  private async handleCommand(event: NormalizedOneBotEvent): Promise<boolean> {
    const command = event.commandText.trim().toLowerCase();
    if (!command.startsWith('/')) {
      return false;
    }

    const replyContext = this.buildReplyContext(event);
    const conversationKey = conversationKeyOf(event);

    switch (command) {
      case '/help':
        await this.gateway.sendText(
          replyContext,
          ['可用命令：', '/help - 查看帮助', '/status - 查看当前机器人状态', '/reset - 重置当前会话'].join('\n'),
        );
        return true;
      case '/status': {
        const persisted = this.conversations.getPersisted(conversationKey);
        const statusText = [
          '🤖 qq-ai-bot 状态',
          `- 通道：${event.mode === 'group' ? '群聊' : '私聊'}`,
          `- 会话键：${conversationKey}`,
          `- 已连接：${this.gateway.isReady() ? '是' : '否'}`,
          `- 远端 ACP Session：${persisted?.remoteSessionId || '暂无'}`,
        ].join('\n');
        await this.gateway.sendText(replyContext, statusText);
        return true;
      }
      case '/reset':
        await this.conversations.reset(conversationKey);
        await this.gateway.sendText(replyContext, '已重置当前会话。下一条消息会重新创建新的 AI 会话。');
        return true;
      default:
        return false;
    }
  }

  private async processUserMessage(event: NormalizedOneBotEvent): Promise<void> {
    const conversationKey = conversationKeyOf(event);
    const runtime = this.conversations.getOrCreate({
      conversationKey,
      chatType: event.mode,
      targetId: event.replyTarget,
    });
    runtime.lastActivityAt = Date.now();

    const persisted = this.conversations.getPersisted(conversationKey);
    const replyContext = this.buildReplyContext(event);
    const progressReporter = new ProgressReporter(
      this.gateway,
      replyContext,
      this.logger.child({ component: 'progress', conversationKey }),
      this.config.onebot.progressMode,
      this.config.ai.verboseMode,
      this.config.ai.progressThrottleMs,
      this.config.ai.maxProgressUpdates,
    );

    try {
      await progressReporter.start();
      const images = await downloadInboundImages({
        urls: event.mediaUrls,
        maxImages: this.config.ai.maxInboundImages,
        maxBytes: this.config.ai.maxInboundImageBytes,
        logger: this.logger.child({ component: 'image-downloader', conversationKey }),
      });
      const response = await runtime.bridge.sendPrompt({
        text: event.cleanedText,
        images,
        sessionIdHint: this.config.ai.reuseSession ? persisted?.remoteSessionId : undefined,
        onProgress: (state) => {
          progressReporter.update(state);
        },
      });
      progressReporter.stop();

      const replyText = this.decorateStopReason(response.text, response.stopReason);
      await this.gateway.sendPayload(replyContext, { text: replyText });
      runtime.lastActivityAt = Date.now();
      await this.conversations.persistRuntime(runtime);
    } catch (error) {
      progressReporter.stop();
      this.logger.error(
        {
          conversationKey,
          error: error instanceof Error ? error.stack || error.message : String(error),
        },
        'failed to process incoming message',
      );
      await this.gateway.sendText(replyContext, this.formatUserFacingError(error));
    }
  }

  private buildReplyContext(event: NormalizedOneBotEvent): OneBotReplyContext {
    return {
      chatType: event.mode,
      targetId: event.replyTarget,
      replyToId: event.replyToId ?? event.messageId,
    };
  }

  private decorateStopReason(text: string, stopReason?: string): string {
    if (!stopReason || stopReason === 'end_turn') {
      return text;
    }
    const suffixMap: Record<string, string> = {
      max_tokens: '\n\n[响应因达到输出长度限制而提前结束]',
      max_turn_requests: '\n\n[响应因达到回合请求上限而提前结束]',
      refusal: '\n\n[Agent 拒绝了本次请求]',
      cancelled: '\n\n[响应已被取消]',
    };
    return `${text}${suffixMap[stopReason] || `\n\n[响应提前结束: ${stopReason}]`}`;
  }

  private formatUserFacingError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `处理消息失败：${message}`;
  }
}
