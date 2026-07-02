import type { PlannedOutboundAction, PlannedOutboundPayload } from '../../types/onebot.js';

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/giu;

function normalizeWhitespace(value: string): string {
  return value
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractMarkdownImageUrls(text: string): {
  cleanedText: string;
  imageUrls: string[];
} {
  const imageUrls: string[] = [];
  const cleanedText = text.replace(MARKDOWN_IMAGE_PATTERN, (_match, url: string) => {
    imageUrls.push(url);
    return '';
  });
  return {
    cleanedText: normalizeWhitespace(cleanedText),
    imageUrls,
  };
}

function uniqueHttpUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const url of urls) {
    if (!/^https?:\/\//i.test(url)) {
      continue;
    }
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    next.push(url);
  }
  return next;
}

export function splitLongText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const result: string[] = [];
  let remaining = text.trim();

  while (remaining.length > maxLength) {
    let splitIndex = remaining.lastIndexOf('\n\n', maxLength);
    if (splitIndex < Math.floor(maxLength * 0.4)) {
      splitIndex = remaining.lastIndexOf('\n', maxLength);
    }
    if (splitIndex < Math.floor(maxLength * 0.4)) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex < Math.floor(maxLength * 0.4)) {
      splitIndex = maxLength;
    }
    result.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining.length > 0) {
    result.push(remaining);
  }

  return result.filter(Boolean);
}

export function planOutboundPayload(params: {
  text: string;
  mediaUrls?: string[];
  maxTextLength: number;
}): PlannedOutboundPayload {
  const extracted = extractMarkdownImageUrls(params.text || '');
  const imageUrls = uniqueHttpUrls([
    ...(params.mediaUrls || []),
    ...extracted.imageUrls,
  ]);

  const actions: PlannedOutboundAction[] = splitLongText(extracted.cleanedText, params.maxTextLength)
    .map((text) => ({
      kind: 'text' as const,
      text,
    }));

  for (const url of imageUrls) {
    actions.push({
      kind: 'image',
      url,
    });
  }

  return {
    actions,
    cleanedText: extracted.cleanedText,
    imageUrls,
  };
}
