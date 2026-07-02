import type * as acp from '@agentclientprotocol/sdk';
import type * as schema from '@agentclientprotocol/sdk';
import type { AgentImageInput } from '../../types/agent.js';

const EMPTY_MESSAGE_FALLBACK = '用户本次消息未包含可处理的文本内容。请提示用户补充信息后重试。';

function appendSystemNote(baseText: string, note: string): string {
  const trimmed = baseText.trim();
  const trimmedNote = note.trim();
  if (!trimmed) {
    return trimmedNote;
  }
  if (!trimmedNote) {
    return trimmed;
  }
  return `${trimmed}\n\n${trimmedNote}`;
}

function buildImageAnalysisPrompt(imageCount: number): string {
  return imageCount > 1
    ? '用户附带了多张图片，请先分析图片内容，再回答用户问题。'
    : '用户附带了一张图片，请先分析图片内容，再回答用户问题。';
}

function buildImageUnavailableNote(imageCount: number): string {
  const imageLabel = imageCount > 1 ? `${imageCount}张图片` : '1张图片';
  return `用户还发送了${imageLabel}，但当前 agent 不支持图片输入。不要假装看到了图片内容；请明确说明当前无法直接读取图片，并引导用户补充文字描述。`;
}

export function supportsImagePrompt(promptCapabilities: schema.PromptCapabilities | undefined): boolean {
  return promptCapabilities?.image !== false;
}

export function buildPromptBlocks(
  text: string,
  images: AgentImageInput[] | undefined,
  promptCapabilities: schema.PromptCapabilities | undefined,
): acp.ContentBlock[] {
  const trimmedText = text.trim();
  const hasImages = Boolean(images && images.length > 0);
  const imageSupported = supportsImagePrompt(promptCapabilities);

  if (hasImages && imageSupported) {
    const prompt: acp.ContentBlock[] = [
      {
        type: 'text',
        text: trimmedText || buildImageAnalysisPrompt(images!.length),
      },
    ];
    for (const image of images || []) {
      prompt.push({
        type: 'image',
        mimeType: image.mimeType,
        data: image.base64Data,
      });
    }
    return prompt;
  }

  if (hasImages && !imageSupported) {
    return [
      {
        type: 'text',
        text: appendSystemNote(trimmedText, buildImageUnavailableNote(images!.length)),
      },
    ];
  }

  return [
    {
      type: 'text',
      text: trimmedText || EMPTY_MESSAGE_FALLBACK,
    },
  ];
}
