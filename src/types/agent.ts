import type * as schema from '@agentclientprotocol/sdk';

export type VerboseMode = 'normal' | 'verbose' | 'debug';
export type PermissionStrategy = 'allow_once' | 'allow_always' | 'cancel';

export interface AgentImageInput {
  mimeType: string;
  base64Data: string;
  sourceUrl?: string;
}

export interface ToolCallEntry {
  toolCallId: string;
  title: string;
  kind?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
}

export interface ThoughtEntry {
  content: string;
  timestamp: Date;
}

export interface ACPBridgeState {
  currentPlan?: schema.Plan;
  accumulatedThoughts: ThoughtEntry[];
  accumulatedToolCalls: ToolCallEntry[];
  accumulatedText: string;
  verboseMode: VerboseMode;
  currentRunId?: string;
}

export interface ACPAgentCapabilities {
  canLoadSession: boolean;
  canListSessions: boolean;
  canCloseSession: boolean;
  promptCapabilities?: schema.PromptCapabilities;
}

export interface AgentResponse {
  text: string;
  stopReason?: schema.StopReason;
  usage?: schema.Usage | null;
  sessionId: string;
}
