import type { OneBotChatType } from './onebot.js';

export interface PersistedConversationState {
  conversationKey: string;
  chatType: OneBotChatType;
  targetId: string;
  remoteSessionId?: string;
  lastActivityAt: string;
}

export interface RuntimeConversationMeta {
  conversationKey: string;
  chatType: OneBotChatType;
  targetId: string;
}
