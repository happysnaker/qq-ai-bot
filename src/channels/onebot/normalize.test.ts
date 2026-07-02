import { describe, expect, it } from 'vitest';
import { normalizeOneBotEvent } from './normalize.js';

describe('normalizeOneBotEvent', () => {
  it('normalizes private message events', () => {
    const event = normalizeOneBotEvent({
      post_type: 'message',
      message_type: 'private',
      user_id: 123,
      self_id: 999,
      message_id: 1,
      raw_message: 'hello',
    });

    expect(event).not.toBeNull();
    expect(event?.mode).toBe('direct');
    expect(event?.cleanedText).toBe('hello');
    expect(event?.wasMentioned).toBe(true);
  });

  it('strips explicit mentions in group messages', () => {
    const event = normalizeOneBotEvent({
      post_type: 'message',
      message_type: 'group',
      user_id: 123,
      self_id: 999,
      group_id: 456,
      message_id: 2,
      message: [
        { type: 'at', data: { qq: '999' } },
        { type: 'text', data: { text: ' 帮我总结下这个 PR' } },
      ],
    });

    expect(event).not.toBeNull();
    expect(event?.mode).toBe('group');
    expect(event?.explicitMention).toBe(true);
    expect(event?.cleanedText).toBe('帮我总结下这个 PR');
  });

  it('parses group commands correctly when raw_message contains CQ at syntax', () => {
    const event = normalizeOneBotEvent({
      post_type: 'message',
      message_type: 'group',
      user_id: 123,
      self_id: 999,
      group_id: 456,
      message_id: 3,
      raw_message: '[CQ:at,qq=999] /help',
      message: [
        { type: 'at', data: { qq: '999' } },
        { type: 'text', data: { text: ' /help' } },
      ],
    });

    expect(event).not.toBeNull();
    expect(event?.explicitMention).toBe(true);
    expect(event?.rawText).toBe('[CQ:at,qq=999] /help');
    expect(event?.cleanedText).toBe('/help');
    expect(event?.commandText).toBe('/help');
  });
});
