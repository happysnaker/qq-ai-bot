import type { OneBotChatType } from './onebot.js';
import type { VerboseMode } from './agent.js';

export type ConversationProgressMode = 'off' | 'message';

export interface PersistedConversationState {
  conversationKey: string;
  chatType: OneBotChatType;
  targetId: string;
  remoteSessionId?: string;
  progressModeOverride?: ConversationProgressMode;
  verboseModeOverride?: VerboseMode;
  lastActivityAt: string;
}

export interface RuntimeConversationMeta {
  conversationKey: string;
  chatType: OneBotChatType;
  targetId: string;
}
