import { describe, expect, it } from 'vitest';
import { buildPromptBlocks } from './prompt.js';

describe('buildPromptBlocks', () => {
  it('injects system prompt and context into text prompt', () => {
    const blocks = buildPromptBlocks({
      text: '帮我总结一下',
      systemPrompt: '你是一个审慎的助手',
      contextLines: ['渠道：QQ群聊', '发送者：小明'],
    });

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: 'text',
    });
    const text = (blocks[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('[系统提示词]');
    expect(text).toContain('你是一个审慎的助手');
    expect(text).toContain('[会话上下文]');
    expect(text).toContain('渠道：QQ群聊');
    expect(text).toContain('[用户消息]');
    expect(text).toContain('帮我总结一下');
  });

  it('includes images when prompt capability supports them', () => {
    const blocks = buildPromptBlocks({
      text: '看图说话',
      promptCapabilities: { image: true },
      images: [
        {
          mimeType: 'image/png',
          base64Data: 'ZmFrZQ==',
        },
      ],
    });

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: 'text' });
    expect(blocks[1]).toMatchObject({ type: 'image', mimeType: 'image/png', data: 'ZmFrZQ==' });
  });

  it('adds explicit fallback note when images are unsupported', () => {
    const blocks = buildPromptBlocks({
      text: '请分析图片',
      promptCapabilities: { image: false },
      images: [
        {
          mimeType: 'image/jpeg',
          base64Data: 'ZmFrZQ==',
        },
      ],
    });

    expect(blocks).toHaveLength(1);
    const text = (blocks[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('当前无法直接读取图片');
    expect(text).toContain('[附加说明]');
  });

  it('adds unsupported media note for non-image attachments', () => {
    const blocks = buildPromptBlocks({
      text: '请处理我发的文件',
      unsupportedMedia: [
        {
          kind: 'file',
          segmentType: 'file',
          name: 'report.pdf',
          url: 'https://example.com/report.pdf',
        },
        {
          kind: 'audio',
          segmentType: 'record',
          url: 'https://example.com/voice.silk',
        },
      ],
    });

    expect(blocks).toHaveLength(1);
    const text = (blocks[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('当前 bot 还不会自动转给 agent 的媒体片段');
    expect(text).toContain('report.pdf');
    expect(text).toContain('语音 / 音频');
    expect(text).toContain('[未直传媒体]');
  });
});
