import { describe, expect, it } from 'vitest';
import { planOutboundPayload, splitLongText } from './outbound.js';

describe('planOutboundPayload', () => {
  it('extracts markdown image urls', () => {
    const plan = planOutboundPayload({
      text: '你好\n\n![img](https://example.com/a.png)',
      maxTextLength: 200,
    });

    expect(plan.cleanedText).toBe('你好');
    expect(plan.imageUrls).toEqual(['https://example.com/a.png']);
    expect(plan.actions).toHaveLength(2);
    expect(plan.actions[0]).toEqual({ kind: 'text', text: '你好' });
    expect(plan.actions[1]).toEqual({ kind: 'image', url: 'https://example.com/a.png' });
  });

  it('splits long text by boundaries', () => {
    const chunks = splitLongText('a '.repeat(200), 60);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 60)).toBe(true);
  });
});
