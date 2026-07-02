import process from 'node:process';
import type { Logger } from 'pino';
import type { AppConfig, GroupConversationPolicy } from '../config/index.js';
import { OneBotGateway } from '../channels/onebot/client.js';
import { normalizeOneBotEvent } from '../channels/onebot/normalize.js';
import { downloadInboundImages } from './image-downloader.js';
import { ProgressReporter } from './progress-reporter.js';
import { ConversationManager } from './conversation-manager.js';
import { AdminServer } from './admin-server.js';
import { getBuildInfo } from './build-info.js';
import { RuntimeMetrics } from './runtime-metrics.js';
import { createSessionStore } from './session-store-factory.js';
import { InboundEventDeduper } from './inbound-event-deduper.js';
import { deriveInboundCorrelationId } from './interaction-correlation.js';
import type { NormalizedOneBotEvent, OneBotReplyContext } from '../types/onebot.js';
import type { AgentImageOutput } from '../types/agent.js';

function conversationKeyOf(event: NormalizedOneBotEvent): string {
  return `${event.mode}:${event.conversationId}`;
}

type ParsedCommand = {
  raw: string;
  name: string;
  args: string[];
};

type ResolvedConversationPolicy = {
  groupPolicy?: GroupConversationPolicy;
  requireMention: boolean;
  systemPrompt?: string;
  systemPromptSource: 'group' | 'default' | 'none';
};

export class BotApplication {
  private readonly gateway: OneBotGateway;
  private readonly conversations: ConversationManager;
  private readonly adminServer: AdminServer;
  private readonly metrics: RuntimeMetrics;
  private readonly inboundDeduper: InboundEventDeduper;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {
    this.metrics = new RuntimeMetrics();
    this.gateway = new OneBotGateway(
      config,
      logger.child({ component: 'onebot' }),
      (chatType) => this.metrics.recordOutboundMessage(chatType),
    );
    this.conversations = new ConversationManager(
      config,
      logger.child({ component: 'conversation-manager' }),
      createSessionStore(config, logger.child({ component: 'session-store' })),
      {
        onAcpPromptStarted: () => this.metrics.recordAcpPromptCall(),
        onAcpPromptFailed: () => this.metrics.recordAcpPromptFailure(),
      },
    );
    this.inboundDeduper = new InboundEventDeduper(
      config.onebot.inboundDedupeWindowMs,
      config.onebot.inboundDedupeMaxEntries,
    );
    this.adminServer = new AdminServer({
      host: config.server.host,
      port: config.server.port,
      logger: logger.child({ component: 'admin-server' }),
      getStatus: () => this.getStatus(),
      getMetrics: () => this.getMetrics(),
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
    const persistedConversations = this.conversations.listPersisted();
    return {
      ok: true,
      build: getBuildInfo(),
      onebot: this.gateway.getStatus(),
      activeConversations: this.conversations.listActive(),
      inboundDedupeCacheSize: this.inboundDeduper.size(),
      persistedConversations: persistedConversations.length,
      config: {
        sessionStore: this.config.storage.sessionStore,
        sessionFilePath:
          this.config.storage.sessionStore === 'file' ? this.config.storage.sessionFilePath : undefined,
        redisKeyPrefix:
          this.config.storage.sessionStore === 'redis' ? this.config.storage.redisKeyPrefix : undefined,
        onebotMode: this.config.onebot.mode,
        allowGroup: this.config.onebot.allowGroup,
        requireMentionInGroup: this.config.onebot.requireMentionInGroup,
        allowPrivate: this.config.onebot.allowPrivate,
        allowGroupCommandsWithoutMention: this.config.onebot.allowGroupCommandsWithoutMention,
        commandPrefix: this.config.onebot.commandPrefix,
        progressMode: this.config.onebot.progressMode,
        inboundDedupeWindowMs: this.config.onebot.inboundDedupeWindowMs,
        inboundDedupeMaxEntries: this.config.onebot.inboundDedupeMaxEntries,
        allowedGroups: this.config.onebot.allowedGroups,
        blockedGroups: this.config.onebot.blockedGroups,
        allowedUsers: this.config.onebot.allowedUsers,
        blockedUsers: this.config.onebot.blockedUsers,
        defaultSystemPromptConfigured: Boolean(this.config.onebot.defaultSystemPrompt),
        configuredGroupPolicies: Object.keys(this.config.onebot.groupPolicies).length,
        groupConfigFilePath: this.config.onebot.groupConfigFilePath,
        acpAgentCommand: this.config.ai.agentCommand,
        acpAgentArgs: this.config.ai.agentArgs,
        reuseSession: this.config.ai.reuseSession,
        verboseMode: this.config.ai.verboseMode,
      },
    };
  }

  getMetrics(): string {
    const onebotStatus = this.gateway.getStatus();
    const persistedConversations = this.conversations.listPersisted();
    return this.metrics.render({
      build: getBuildInfo(),
      onebotConnected: Boolean(onebotStatus.connected),
      onebotReconnectAttempts: onebotStatus.reconnectAttempts ?? 0,
      activeConversations: this.conversations.listActive().length,
      persistedConversations: persistedConversations.length,
    });
  }

  private async handleIncomingPayload(payload: unknown): Promise<void> {
    const event = normalizeOneBotEvent(payload);
    if (!event) {
      return;
    }
    const correlationId = deriveInboundCorrelationId(event);
    const eventLogger = this.logger.child({
      correlationId,
      conversationId: event.conversationId,
      senderId: event.senderId,
      messageId: event.messageId,
    });
    this.metrics.recordInboundMessage();
    eventLogger.info(
      {
        mode: event.mode,
        wasMentioned: event.wasMentioned,
        commandPreview: event.commandText.length > 120 ? `${event.commandText.slice(0, 120)}...` : event.commandText,
        mediaCount: event.mediaUrls.length,
        unsupportedMediaCount: event.unsupportedMedia.length,
      },
      'received inbound onebot event',
    );

    const dedupe = this.inboundDeduper.check(event);
    if (dedupe.duplicate) {
      this.metrics.recordInboundDuplicate();
      eventLogger.info(
        {
          eventId: event.id,
          dedupeKey: dedupe.key,
          messageId: event.messageId,
          conversationId: event.conversationId,
          senderId: event.senderId,
        },
        'skip duplicate inbound onebot event',
      );
      return;
    }

    const command = this.parseCommand(event.commandText);

    if (event.isSelfMessage) {
      eventLogger.debug('skip self message');
      return;
    }

    if (!this.isEventAllowed(event, command)) {
      eventLogger.info(
        {
          command: command?.name,
        },
        'skip inbound event by policy',
      );
      return;
    }

    if (command && (await this.handleCommand(event, command, correlationId, eventLogger))) {
      return;
    }

    await this.processUserMessage(event, correlationId, eventLogger);
  }

  private isEventAllowed(event: NormalizedOneBotEvent, command: ParsedCommand | null): boolean {
    if (this.config.onebot.blockedUsers.includes(event.senderId)) {
      return false;
    }
    if (
      this.config.onebot.allowedUsers.length > 0 &&
      !this.config.onebot.allowedUsers.includes(event.senderId)
    ) {
      return false;
    }

    if (event.mode === 'direct') {
      if (!this.config.onebot.allowPrivate) {
        return false;
      }
      return true;
    }

    if (!this.config.onebot.allowGroup) {
      return false;
    }
    if (
      this.config.onebot.allowedGroups.length > 0 &&
      !this.config.onebot.allowedGroups.includes(event.conversationId)
    ) {
      return false;
    }
    if (this.config.onebot.blockedGroups.includes(event.conversationId)) {
      return false;
    }

    const policy = this.resolveConversationPolicy(event);
    if (policy.groupPolicy?.enabled === false) {
      return false;
    }
    const mentionBypass = Boolean(command && this.config.onebot.allowGroupCommandsWithoutMention);
    if (policy.requireMention && !event.wasMentioned && !mentionBypass) {
      return false;
    }
    return true;
  }

  private async handleCommand(
    event: NormalizedOneBotEvent,
    command: ParsedCommand,
    correlationId: string,
    eventLogger: Logger,
  ): Promise<boolean> {
    const replyContext = this.buildReplyContext(event, correlationId, 'command');
    const conversationKey = conversationKeyOf(event);
    const policy = this.resolveConversationPolicy(event);
    const prefix = this.config.onebot.commandPrefix;
    this.metrics.recordProcessedMessage('command');
    this.metrics.recordCommand(command.name);
    eventLogger.info({ command: command.name, conversationKey }, 'handling command');

    switch (command.name) {
      case '':
        await this.gateway.sendText(replyContext, `无效命令。发送 ${prefix}help 查看帮助。`);
        return true;
      case 'help':
        await this.gateway.sendText(
          replyContext,
          [
            '可用命令：',
            `${prefix}help - 查看帮助`,
            `${prefix}status - 查看当前机器人状态和当前会话策略`,
            `${prefix}prompt - 查看当前会话生效的 system prompt`,
            `${prefix}reset - 重置当前会话`,
            `${prefix}ping - 检查机器人是否在线`,
          ].join('\n'),
        );
        return true;
      case 'status': {
        const persisted = this.conversations.getPersisted(conversationKey);
        const statusText = [
          '🤖 qq-ai-bot 状态',
          `- 版本：${getBuildInfo().version}`,
          `- 启动时间：${getBuildInfo().startedAt}`,
          `- 通道：${event.mode === 'group' ? '群聊' : '私聊'}`,
          `- 会话键：${conversationKey}`,
          `- 已连接：${this.gateway.isReady() ? '是' : '否'}`,
          `- Session Store：${this.config.storage.sessionStore}`,
          `- 远端 ACP Session：${persisted?.remoteSessionId || '暂无'}`,
          `- 命令前缀：${prefix}`,
          `- 群聊触发：${event.mode === 'group' ? (policy.requireMention ? '仅 @ 机器人' : '无需 @') : '私聊直达'}`,
          `- 当前 system prompt：${this.describeSystemPrompt(policy)}`,
        ].join('\n');
        await this.gateway.sendText(replyContext, statusText);
        return true;
      }
      case 'prompt': {
        await this.gateway.sendText(
          replyContext,
          this.renderPromptPreview(event, policy),
        );
        return true;
      }
      case 'reset':
        await this.conversations.reset(conversationKey);
        await this.gateway.sendText(replyContext, '已重置当前会话。下一条消息会重新创建新的 AI 会话。');
        return true;
      case 'ping':
        await this.gateway.sendText(replyContext, 'pong');
        return true;
      default:
        await this.gateway.sendText(
          replyContext,
          `未知命令：${command.raw}。发送 ${prefix}help 查看帮助。`,
        );
        return true;
    }
  }

  private async processUserMessage(
    event: NormalizedOneBotEvent,
    correlationId: string,
    eventLogger: Logger,
  ): Promise<void> {
    this.metrics.recordProcessedMessage('user_message');
    const conversationKey = conversationKeyOf(event);
    const policy = this.resolveConversationPolicy(event);
    const runtime = this.conversations.getOrCreate({
      conversationKey,
      chatType: event.mode,
      targetId: event.replyTarget,
    });
    runtime.lastActivityAt = Date.now();

    const persisted = this.conversations.getPersisted(conversationKey);
    const replyContext = this.buildReplyContext(event, correlationId, 'reply');
    const progressReporter = new ProgressReporter(
      this.gateway,
      replyContext,
      this.logger.child({ component: 'progress', conversationKey, correlationId }),
      this.config.onebot.progressMode,
      this.config.ai.verboseMode,
      this.config.ai.progressThrottleMs,
      this.config.ai.maxProgressUpdates,
    );
    eventLogger.info(
      {
        conversationKey,
        reusedSessionHint: this.config.ai.reuseSession ? persisted?.remoteSessionId : undefined,
        unsupportedMedia: event.unsupportedMedia.map((item) => ({
          kind: item.kind,
          segmentType: item.segmentType,
          name: item.name,
        })),
      },
      'processing user message',
    );

    try {
      await progressReporter.start();
      const images = await downloadInboundImages({
        urls: event.mediaUrls,
        maxImages: this.config.ai.maxInboundImages,
        maxBytes: this.config.ai.maxInboundImageBytes,
        logger: this.logger.child({ component: 'image-downloader', conversationKey, correlationId }),
      });
      const response = await runtime.bridge.sendPrompt({
        text: event.cleanedText,
        images,
        sessionIdHint: this.config.ai.reuseSession ? persisted?.remoteSessionId : undefined,
        systemPrompt: policy.systemPrompt,
        contextLines: this.buildPromptContext(event, policy),
        unsupportedMedia: event.unsupportedMedia,
        correlationId,
        onProgress: (state) => {
          progressReporter.update(state);
        },
      });
      progressReporter.stop();

      const replyText = this.decorateStopReason(response.text, response.stopReason);
      await this.gateway.sendPayload(
        {
          ...replyContext,
          purpose: 'reply',
        },
        {
        text: replyText,
        mediaImages: response.images.map((image) => this.toOutboundImage(image)),
        },
      );
      eventLogger.info(
        {
          conversationKey,
          sessionId: response.sessionId,
          stopReason: response.stopReason,
          outputImages: response.images.length,
          replyLength: replyText.length,
        },
        'completed user message processing',
      );
      runtime.lastActivityAt = Date.now();
      await this.conversations.persistRuntime(runtime);
    } catch (error) {
      progressReporter.stop();
      this.metrics.recordError('message_processing');
      eventLogger.error(
        {
          conversationKey,
          error: error instanceof Error ? error.stack || error.message : String(error),
        },
        'failed to process incoming message',
      );
      await this.gateway.sendText(
        {
          ...replyContext,
          purpose: 'error',
        },
        this.formatUserFacingError(error),
      );
    }
  }

  private buildReplyContext(
    event: NormalizedOneBotEvent,
    correlationId?: string,
    purpose?: OneBotReplyContext['purpose'],
  ): OneBotReplyContext {
    return {
      chatType: event.mode,
      targetId: event.replyTarget,
      replyToId: event.replyToId ?? event.messageId,
      correlationId,
      purpose,
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

  private parseCommand(text: string): ParsedCommand | null {
    const trimmed = text.trim();
    const prefix = this.config.onebot.commandPrefix;
    if (!trimmed.startsWith(prefix)) {
      return null;
    }
    const withoutPrefix = trimmed.slice(prefix.length).trim();
    if (!withoutPrefix) {
      return {
        raw: prefix,
        name: '',
        args: [],
      };
    }
    const [name, ...args] = withoutPrefix.split(/\s+/);
    return {
      raw: trimmed,
      name: name.toLowerCase(),
      args,
    };
  }

  private resolveConversationPolicy(event: NormalizedOneBotEvent): ResolvedConversationPolicy {
    if (event.mode !== 'group') {
      return {
        requireMention: false,
        systemPrompt: this.config.onebot.defaultSystemPrompt,
        systemPromptSource: this.config.onebot.defaultSystemPrompt ? 'default' : 'none',
      };
    }

    const groupPolicy = this.config.onebot.groupPolicies[event.conversationId];
    if (groupPolicy?.systemPrompt) {
      return {
        groupPolicy,
        requireMention: groupPolicy.requireMention ?? this.config.onebot.requireMentionInGroup,
        systemPrompt: groupPolicy.systemPrompt,
        systemPromptSource: 'group',
      };
    }

    return {
      groupPolicy,
      requireMention: groupPolicy?.requireMention ?? this.config.onebot.requireMentionInGroup,
      systemPrompt: this.config.onebot.defaultSystemPrompt,
      systemPromptSource: this.config.onebot.defaultSystemPrompt ? 'default' : 'none',
    };
  }

  private buildPromptContext(
    event: NormalizedOneBotEvent,
    policy: ResolvedConversationPolicy,
  ): string[] {
    const lines = [
      `渠道：QQ${event.mode === 'group' ? '群聊' : '私聊'}`,
      `会话 ID：${event.conversationId}`,
      `发送者 ID：${event.senderId}`,
      event.senderName ? `发送者昵称：${event.senderName}` : undefined,
      event.mode === 'group' && policy.groupPolicy?.name ? `群聊名称：${policy.groupPolicy.name}` : undefined,
      event.mode === 'group' ? `群聊触发规则：${policy.requireMention ? '仅在 @ 机器人时答复' : '无需 @ 即可答复'}` : undefined,
    ];
    return lines.filter((line): line is string => Boolean(line));
  }

  private describeSystemPrompt(policy: ResolvedConversationPolicy): string {
    switch (policy.systemPromptSource) {
      case 'group':
        return `已配置（当前群专属${policy.groupPolicy?.name ? `：${policy.groupPolicy.name}` : ''}）`;
      case 'default':
        return '已配置（全局默认）';
      default:
        return '未配置';
    }
  }

  private renderPromptPreview(
    event: NormalizedOneBotEvent,
    policy: ResolvedConversationPolicy,
  ): string {
    const sourceLabel =
      policy.systemPromptSource === 'group'
        ? `当前群专属${policy.groupPolicy?.name ? `：${policy.groupPolicy.name}` : ''}`
        : policy.systemPromptSource === 'default'
          ? '全局默认'
          : '未配置';
    const prompt = policy.systemPrompt?.trim();

    return [
      '🧠 当前会话 system prompt',
      `- 会话类型：${event.mode === 'group' ? '群聊' : '私聊'}`,
      `- 来源：${sourceLabel}`,
      '',
      prompt || '（未配置 system prompt，将直接把用户消息转发给本地 AI）',
    ].join('\n');
  }

  private formatUserFacingError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('ACP connection closed') ||
      message.includes('ACP connection is not initialized') ||
      message.includes('ACP session is not ready')
    ) {
      return '处理消息失败：本地 AI 连接刚刚断开，已自动清理连接。请直接重试一次；如果还失败，请先发送 /reset 再试。';
    }
    return `处理消息失败：${message}`;
  }

  private toOutboundImage(image: AgentImageOutput): {
    kind: 'url' | 'base64';
    value: string;
    mimeType?: string;
  } {
    if (image.uri && /^https?:\/\//i.test(image.uri)) {
      return {
        kind: 'url',
        value: image.uri,
        mimeType: image.mimeType,
      };
    }
    return {
      kind: 'base64',
      value: image.base64Data,
      mimeType: image.mimeType,
    };
  }
}
