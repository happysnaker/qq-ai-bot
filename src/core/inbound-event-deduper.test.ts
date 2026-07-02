import { describe, expect, it } from 'vitest';
import { InboundEventDeduper } from './inbound-event-deduper.js';
import type { NormalizedOneBotEvent } from '../types/onebot.js';

function makeEvent(overrides: Partial<NormalizedOneBotEvent> = {}): NormalizedOneBotEvent {
  return {
    id: 'group:123:1',
    mode: 'group',
    conversationId: '123',
    replyTarget: '123',
    senderId: 'u1',
    senderName: 'tester',
    messageId: '1',
    selfId: 'bot',
    rawText: 'hello',
    cleanedText: 'hello',
    commandText: 'hello',
    replyToId: undefined,
    mediaUrls: [],
    mentionedUserIds: ['bot'],
    wasMentioned: true,
    explicitMention: true,
    isSelfMessage: false,
    timestamp: 1_720_000_000_000,
    raw: {
      post_type: 'message',
      message_type: 'group',
      group_id: '123',
      user_id: 'u1',
      message_id: '1',
    },
    ...overrides,
  };
}

describe('InboundEventDeduper', () => {
  it('deduplicates repeated events with the same message id inside the window', () => {
    const deduper = new InboundEventDeduper(60_000, 100);
    const event = makeEvent();

    expect(deduper.isDuplicate(event, 1_000)).toBe(false);
    expect(deduper.isDuplicate(event, 1_100)).toBe(true);
  });

  it('allows the same message id again after the window expires', () => {
    const deduper = new InboundEventDeduper(1_000, 100);
    const event = makeEvent();

    expect(deduper.isDuplicate(event, 1_000)).toBe(false);
    expect(deduper.isDuplicate(event, 2_500)).toBe(false);
  });

  it('falls back to sender + conversation + timestamp + text when message id is missing', () => {
    const deduper = new InboundEventDeduper(60_000, 100);
    const event = makeEvent({
      id: 'group:123:no-mid',
      messageId: undefined,
      raw: {
        post_type: 'message',
        message_type: 'group',
        group_id: '123',
        user_id: 'u1',
      },
    });

    expect(deduper.isDuplicate(event, 1_000)).toBe(false);
    expect(deduper.isDuplicate({ ...event }, 1_200)).toBe(true);
    expect(
      deduper.isDuplicate(
        {
          ...event,
          cleanedText: 'different',
          rawText: 'different',
        },
        1_300,
      ),
    ).toBe(false);
  });

  it('caps stored entries to the configured limit', () => {
    const deduper = new InboundEventDeduper(60_000, 2);
    expect(deduper.isDuplicate(makeEvent({ messageId: '1' }), 1_000)).toBe(false);
    expect(deduper.isDuplicate(makeEvent({ messageId: '2', id: 'group:123:2' }), 1_001)).toBe(false);
    expect(deduper.isDuplicate(makeEvent({ messageId: '3', id: 'group:123:3' }), 1_002)).toBe(false);
    expect(deduper.size()).toBe(2);
  });
});
