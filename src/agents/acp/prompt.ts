import type * as acp from '@agentclientprotocol/sdk';
import type * as schema from '@agentclientprotocol/sdk';
import type { AgentImageInput } from '../../types/agent.js';
import type { UnsupportedInboundMedia } from '../../types/onebot.js';

const EMPTY_MESSAGE_FALLBACK = '用户本次消息未包含可处理的文本内容。请提示用户补充信息后重试。';

function buildImageAnalysisPrompt(imageCount: number): string {
  return imageCount > 1
    ? '用户附带了多张图片，请先分析图片内容，再回答用户问题。'
    : '用户附带了一张图片，请先分析图片内容，再回答用户问题。';
}

function buildImageUnavailableNote(imageCount: number): string {
  const imageLabel = imageCount > 1 ? `${imageCount}张图片` : '1张图片';
  return `用户还发送了${imageLabel}，但当前 agent 不支持图片输入。不要假装看到了图片内容；请明确说明当前无法直接读取图片，并引导用户补充文字描述。`;
}

function mediaKindLabel(kind: UnsupportedInboundMedia['kind']): string {
  switch (kind) {
    case 'audio':
      return '语音 / 音频';
    case 'video':
      return '视频';
    case 'file':
      return '文件';
    default:
      return '其他媒体';
  }
}

function buildUnsupportedMediaNote(media: UnsupportedInboundMedia[]): string {
  const entries = media.map((item) => {
    const details = [
      mediaKindLabel(item.kind),
      item.name ? `name=${item.name}` : undefined,
      item.url ? `source=${item.url}` : undefined,
      `segment=${item.segmentType}`,
    ].filter(Boolean);
    return `- ${details.join(' | ')}`;
  });

  return [
    `用户还发送了 ${media.length} 个当前 bot 还不会自动转给 agent 的媒体片段。`,
    '不要假装你已经读取了这些媒体内容；如果用户的问题依赖这些附件，请明确说明当前只稳定支持文本与图片，并请用户补充文字描述、摘要，或把关键内容转成图片 / 文本后重试。',
    '[未直传媒体]',
    ...entries,
  ].join('\n');
}

function composeTextPrompt(params: {
  userText: string;
  systemPrompt?: string;
  contextLines?: string[];
  extraNote?: string;
}): string {
  const sections: string[] = [];
  if (params.systemPrompt?.trim()) {
    sections.push(['[系统提示词]', params.systemPrompt.trim()].join('\n'));
  }
  if (params.contextLines && params.contextLines.length > 0) {
    sections.push(['[会话上下文]', params.contextLines.map((line) => `- ${line}`).join('\n')].join('\n'));
  }

  const userMessage = params.userText.trim() || EMPTY_MESSAGE_FALLBACK;
  sections.push(['[用户消息]', userMessage].join('\n'));

  if (params.extraNote?.trim()) {
    sections.push(['[附加说明]', params.extraNote.trim()].join('\n'));
  }
  return sections.join('\n\n').trim();
}

export function supportsImagePrompt(promptCapabilities: schema.PromptCapabilities | undefined): boolean {
  return promptCapabilities?.image !== false;
}

export function buildPromptBlocks(params: {
  text: string;
  images?: AgentImageInput[];
  unsupportedMedia?: UnsupportedInboundMedia[];
  promptCapabilities?: schema.PromptCapabilities;
  systemPrompt?: string;
  contextLines?: string[];
}): acp.ContentBlock[] {
  const trimmedText = params.text.trim();
  const hasImages = Boolean(params.images && params.images.length > 0);
  const hasUnsupportedMedia = Boolean(params.unsupportedMedia && params.unsupportedMedia.length > 0);
  const imageSupported = supportsImagePrompt(params.promptCapabilities);
  const unsupportedMediaNote = hasUnsupportedMedia ? buildUnsupportedMediaNote(params.unsupportedMedia!) : undefined;

  if (hasImages && imageSupported) {
    const prompt: acp.ContentBlock[] = [
      {
        type: 'text',
        text: composeTextPrompt({
          userText: trimmedText || buildImageAnalysisPrompt(params.images!.length),
          systemPrompt: params.systemPrompt,
          contextLines: params.contextLines,
          extraNote: unsupportedMediaNote,
        }),
      },
    ];
    for (const image of params.images || []) {
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
        text: composeTextPrompt({
          userText: trimmedText,
          systemPrompt: params.systemPrompt,
          contextLines: params.contextLines,
          extraNote: [buildImageUnavailableNote(params.images!.length), unsupportedMediaNote]
            .filter(Boolean)
            .join('\n\n'),
        }),
      },
    ];
  }

  return [
    {
      type: 'text',
      text: composeTextPrompt({
        userText: trimmedText,
        systemPrompt: params.systemPrompt,
        contextLines: params.contextLines,
        extraNote: unsupportedMediaNote,
      }),
    },
  ];
}
