export type OneBotChatType = 'direct' | 'group';

export interface OneBotMessageSegment {
  type: string;
  data?: Record<string, unknown>;
}

export interface OneBotActionResponse {
  status?: string;
  retcode?: number;
  data?: Record<string, unknown>;
  echo?: string;
  msg?: string;
  wording?: string;
}

export interface OneBotMessageEvent {
  post_type?: string;
  message_type?: string;
  sub_type?: string;
  user_id?: string | number;
  group_id?: string | number;
  self_id?: string | number;
  message_id?: string | number;
  raw_message?: string;
  message?: string | OneBotMessageSegment[];
  sender?: {
    user_id?: string | number;
    nickname?: string;
    card?: string;
  };
  time?: number;
  [key: string]: unknown;
}

export interface NormalizedOneBotEvent {
  id: string;
  mode: OneBotChatType;
  conversationId: string;
  replyTarget: string;
  senderId: string;
  senderName?: string;
  messageId?: string;
  selfId?: string;
  rawText: string;
  cleanedText: string;
  commandText: string;
  replyToId?: string;
  mediaUrls: string[];
  mentionedUserIds: string[];
  wasMentioned: boolean;
  explicitMention: boolean;
  isSelfMessage: boolean;
  timestamp?: number;
  raw: OneBotMessageEvent;
}

export interface OneBotReplyContext {
  chatType: OneBotChatType;
  targetId: string;
  replyToId?: string;
}

export interface PlannedOutboundAction {
  kind: 'text' | 'image';
  text?: string;
  url?: string;
}

export interface PlannedOutboundPayload {
  actions: PlannedOutboundAction[];
  cleanedText: string;
  imageUrls: string[];
}

export interface TransportStatusPatch {
  connected?: boolean;
  reconnectAttempts?: number;
  lastConnectedAt?: number | null;
  lastDisconnect?: string | null;
  lastInboundAt?: number | null;
  lastOutboundAt?: number | null;
  lastEventAt?: number | null;
  lastError?: string | null;
}
