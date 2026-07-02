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
import { getBuildInfo } from './build-info.js';
import type { NormalizedOneBotEvent, OneBotReplyContext } from '../types/onebot.js';
import type { GroupConversationPolicy } from '../config/index.js';

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
      build: getBuildInfo(),
      onebot: this.gateway.getStatus(),
      activeConversations: this.conversations.listActive(),
      persistedConversations: this.conversations.listPersisted().length,
      config: {
        onebotMode: this.config.onebot.mode,
        allowGroup: this.config.onebot.allowGroup,
        requireMentionInGroup: this.config.onebot.requireMentionInGroup,
        allowPrivate: this.config.onebot.allowPrivate,
        allowGroupCommandsWithoutMention: this.config.onebot.allowGroupCommandsWithoutMention,
        commandPrefix: this.config.onebot.commandPrefix,
        progressMode: this.config.onebot.progressMode,
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

  private async handleIncomingPayload(payload: unknown): Promise<void> {
    const event = normalizeOneBotEvent(payload);
    if (!event) {
      return;
    }
    const command = this.parseCommand(event.commandText);

    if (event.isSelfMessage) {
      return;
    }

    if (!this.isEventAllowed(event, command)) {
      return;
    }

    if (command && (await this.handleCommand(event, command))) {
      return;
    }

    await this.processUserMessage(event);
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

  private async handleCommand(event: NormalizedOneBotEvent, command: ParsedCommand): Promise<boolean> {
    const replyContext = this.buildReplyContext(event);
    const conversationKey = conversationKeyOf(event);
    const policy = this.resolveConversationPolicy(event);
    const prefix = this.config.onebot.commandPrefix;

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

  private async processUserMessage(event: NormalizedOneBotEvent): Promise<void> {
    const conversationKey = conversationKeyOf(event);
    const policy = this.resolveConversationPolicy(event);
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
        systemPrompt: policy.systemPrompt,
        contextLines: this.buildPromptContext(event, policy),
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
}
