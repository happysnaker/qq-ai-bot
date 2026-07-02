import { describe, expect, it } from 'vitest';
import { RuntimeMetrics } from './runtime-metrics.js';

describe('RuntimeMetrics', () => {
  it('renders Prometheus style metrics with counters and gauges', () => {
    const metrics = new RuntimeMetrics();
    metrics.recordInboundMessage();
    metrics.recordInboundDuplicate();
    metrics.recordProcessedMessage('command');
    metrics.recordCommand('status');
    metrics.recordOutboundMessage('group');
    metrics.recordAcpPromptCall();
    metrics.recordAcpPromptFailure();
    metrics.recordError('acp_prompt');

    const output = metrics.render({
      build: {
        appName: 'qq-ai-bot',
        version: '0.1.3',
        gitCommit: 'abc123',
        buildRef: 'main',
        startedAt: '2026-07-02T00:00:00.000Z',
      },
      onebotConnected: true,
      onebotReconnectAttempts: 2,
      activeConversations: 3,
      persistedConversations: 4,
    });

    expect(output).toContain('# HELP qq_ai_bot_build_info');
    expect(output).toContain('qq_ai_bot_build_info{build_ref="main",git_commit="abc123",version="0.1.3"} 1');
    expect(output).toContain('qq_ai_bot_onebot_connected 1');
    expect(output).toContain('qq_ai_bot_onebot_reconnect_attempts 2');
    expect(output).toContain('qq_ai_bot_active_conversations 3');
    expect(output).toContain('qq_ai_bot_persisted_conversations 4');
    expect(output).toContain('qq_ai_bot_inbound_messages_total 1');
    expect(output).toContain('qq_ai_bot_inbound_duplicates_total 1');
    expect(output).toContain('qq_ai_bot_processed_messages_total{kind="command"} 1');
    expect(output).toContain('qq_ai_bot_commands_total{command="status"} 1');
    expect(output).toContain('qq_ai_bot_outbound_messages_total{chat_type="group"} 1');
    expect(output).toContain('qq_ai_bot_acp_prompt_calls_total 1');
    expect(output).toContain('qq_ai_bot_acp_prompt_failures_total 1');
    expect(output).toContain('qq_ai_bot_errors_total{kind="acp_prompt"} 1');
  });

  it('emits zero-labelled counters when nothing has happened yet', () => {
    const metrics = new RuntimeMetrics();
    const output = metrics.render({
      build: {
        appName: 'qq-ai-bot',
        version: '0.1.3',
        startedAt: '2026-07-02T00:00:00.000Z',
      },
      onebotConnected: false,
      onebotReconnectAttempts: 0,
      activeConversations: 0,
      persistedConversations: 0,
    });

    expect(output).toContain('qq_ai_bot_processed_messages_total{kind="none"} 0');
    expect(output).toContain('qq_ai_bot_commands_total{command="none"} 0');
    expect(output).toContain('qq_ai_bot_outbound_messages_total{chat_type="none"} 0');
    expect(output).toContain('qq_ai_bot_errors_total{kind="none"} 0');
    expect(output).toContain('qq_ai_bot_inbound_duplicates_total 0');
  });
});
