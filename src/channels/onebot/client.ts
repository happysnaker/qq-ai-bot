import type { Logger } from 'pino';
import type { AppConfig } from '../../config/index.js';
import type {
  OneBotActionResponse,
  OneBotReplyContext,
  PlannedOutboundPayload,
  TransportStatusPatch,
} from '../../types/onebot.js';
import { planOutboundPayload } from './outbound.js';
import {
  type ActionTransport,
  startForwardWsTransport,
  startReverseWsTransport,
} from './transport.js';

export class OneBotGateway {
  private transport: ActionTransport | null = null;
  private latestStatus: Required<TransportStatusPatch> = {
    connected: false,
    reconnectAttempts: 0,
    lastConnectedAt: null,
    lastDisconnect: null,
    lastInboundAt: null,
    lastOutboundAt: null,
    lastEventAt: null,
    lastError: null,
  };

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  async start(onEvent: (payload: unknown) => Promise<void>): Promise<void> {
    const onStatus = (patch: TransportStatusPatch): void => {
      this.latestStatus = {
        ...this.latestStatus,
        ...patch,
      };
    };

    if (this.config.onebot.mode === 'forward') {
      this.transport = startForwardWsTransport({
        url: this.config.onebot.forwardWsUrl,
        accessToken: this.config.onebot.accessToken,
        onEvent,
        onStatus,
      });
      this.logger.info({ url: this.config.onebot.forwardWsUrl }, 'onebot forward websocket connecting');
      return;
    }

    this.transport = await startReverseWsTransport({
      host: this.config.onebot.reverseWsHost,
      port: this.config.onebot.reverseWsPort,
      path: this.config.onebot.reverseWsPath,
      accessToken: this.config.onebot.accessToken,
      onEvent,
      onStatus,
    });
    this.logger.info(
      {
        host: this.config.onebot.reverseWsHost,
        port: this.config.onebot.reverseWsPort,
        path: this.config.onebot.reverseWsPath,
      },
      'onebot reverse websocket listening',
    );
  }

  async stop(): Promise<void> {
    await this.transport?.close();
    this.transport = null;
  }

  isReady(): boolean {
    return this.transport?.isReady() ?? false;
  }

  getStatus(): Required<TransportStatusPatch> {
    return this.latestStatus;
  }

  async sendText(context: OneBotReplyContext, text: string): Promise<string | undefined> {
    return this.sendConversationMessage({
      ...context,
      message: this.buildMessageSegments({
        text,
        replyToId: context.replyToId,
      }),
    });
  }

  async sendPayload(
    context: OneBotReplyContext,
    params: {
      text: string;
      mediaUrls?: string[];
    },
  ): Promise<string[]> {
    const plan = planOutboundPayload({
      text: params.text,
      mediaUrls: params.mediaUrls,
      maxTextLength: this.config.onebot.outboundMaxTextLength,
    });
    return this.sendPlannedPayload(context, plan);
  }

  async sendPlannedPayload(
    context: OneBotReplyContext,
    plan: PlannedOutboundPayload,
  ): Promise<string[]> {
    const messageIds: string[] = [];
    let first = true;
    for (const action of plan.actions) {
      if (action.kind === 'text' && action.text) {
        const messageId = await this.sendConversationMessage({
          ...context,
          replyToId: first ? context.replyToId : undefined,
          message: this.buildMessageSegments({
            text: action.text,
            replyToId: first ? context.replyToId : undefined,
          }),
        });
        if (messageId) {
          messageIds.push(messageId);
        }
      }
      if (action.kind === 'image' && action.url) {
        const messageId = await this.sendConversationMessage({
          ...context,
          replyToId: first ? context.replyToId : undefined,
          message: this.buildMessageSegments({
            imageUrl: action.url,
            replyToId: first ? context.replyToId : undefined,
          }),
        });
        if (messageId) {
          messageIds.push(messageId);
        }
      }
      first = false;
    }
    return messageIds;
  }

  private buildMessageSegments(params: {
    text?: string;
    imageUrl?: string;
    replyToId?: string;
  }): string | Array<Record<string, unknown>> {
    const segments: Array<Record<string, unknown>> = [];
    if (params.replyToId) {
      segments.push({
        type: 'reply',
        data: { id: params.replyToId },
      });
    }
    if (params.text) {
      segments.push({
        type: 'text',
        data: { text: params.text },
      });
    }
    if (params.imageUrl) {
      segments.push({
        type: 'image',
        data: { file: params.imageUrl },
      });
    }
    if (segments.length === 1 && params.text && !params.replyToId) {
      return params.text;
    }
    return segments;
  }

  private async sendConversationMessage(params: {
    chatType: OneBotReplyContext['chatType'];
    targetId: string;
    replyToId?: string;
    message: string | Array<Record<string, unknown>>;
  }): Promise<string | undefined> {
    if (!this.transport) {
      throw new Error('onebot transport is not initialized');
    }
    const action = params.chatType === 'group' ? 'send_group_msg' : 'send_private_msg';
    const actionParams =
      params.chatType === 'group'
        ? { group_id: params.targetId, message: params.message }
        : { user_id: params.targetId, message: params.message };

    const response = await this.transport.sendAction(action, actionParams);
    return this.extractMessageId(response);
  }

  private extractMessageId(response: OneBotActionResponse): string | undefined {
    const messageId = response.data?.message_id;
    if (typeof messageId === 'string' || typeof messageId === 'number') {
      return String(messageId);
    }
    return undefined;
  }
}
