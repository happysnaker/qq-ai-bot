import type { NormalizedOneBotEvent } from '../types/onebot.js';

type SeenEvent = {
  key: string;
  seenAt: number;
};

function stableTextPart(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed;
}

export class InboundEventDeduper {
  private readonly seen = new Map<string, SeenEvent>();

  constructor(
    private readonly windowMs: number,
    private readonly maxEntries: number,
  ) {}

  isDuplicate(event: NormalizedOneBotEvent, now = Date.now()): boolean {
    this.cleanup(now);
    const key = this.buildKey(event);
    const existing = this.seen.get(key);
    if (existing && now - existing.seenAt <= this.windowMs) {
      existing.seenAt = now;
      this.seen.delete(key);
      this.seen.set(key, existing);
      return true;
    }

    this.seen.set(key, { key, seenAt: now });
    this.trimToLimit();
    return false;
  }

  size(): number {
    return this.seen.size;
  }

  private buildKey(event: NormalizedOneBotEvent): string {
    const messageId = event.messageId?.trim();
    if (messageId) {
      return `mid:${event.mode}:${event.conversationId}:${messageId}`;
    }

    const replyToId = event.replyToId?.trim() || 'none';
    const timestampBucket = event.timestamp ? String(Math.floor(event.timestamp / 1000)) : 'no-ts';
    const cleanedText = stableTextPart(event.cleanedText || event.rawText);
    const mediaPart = event.mediaUrls.slice(0, 3).join(',');

    return [
      'fallback',
      event.mode,
      event.conversationId,
      event.senderId,
      replyToId,
      timestampBucket,
      cleanedText,
      mediaPart,
    ].join(':');
  }

  private cleanup(now: number): void {
    for (const [key, value] of this.seen) {
      if (now - value.seenAt > this.windowMs) {
        this.seen.delete(key);
      }
    }
  }

  private trimToLimit(): void {
    if (this.seen.size <= this.maxEntries) {
      return;
    }
    const overflow = this.seen.size - this.maxEntries;
    const keys = this.seen.keys();
    for (let i = 0; i < overflow; i += 1) {
      const next = keys.next();
      if (next.done) {
        return;
      }
      this.seen.delete(next.value);
    }
  }
}
