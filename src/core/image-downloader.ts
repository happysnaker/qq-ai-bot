import type { Logger } from 'pino';
import type { AgentImageInput } from '../types/agent.js';

function inferMimeType(contentType: string | null, url: string): string {
  if (contentType && contentType.trim()) {
    return contentType.split(';', 1)[0].trim();
  }
  if (/\.png(?:$|[?#])/i.test(url)) {
    return 'image/png';
  }
  if (/\.webp(?:$|[?#])/i.test(url)) {
    return 'image/webp';
  }
  if (/\.gif(?:$|[?#])/i.test(url)) {
    return 'image/gif';
  }
  return 'image/jpeg';
}

export async function downloadInboundImages(params: {
  urls: string[];
  maxImages: number;
  maxBytes: number;
  logger: Logger;
}): Promise<AgentImageInput[]> {
  const images: AgentImageInput[] = [];
  const selectedUrls = params.urls.slice(0, params.maxImages);

  for (const url of selectedUrls) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        params.logger.warn({ url, status: response.status }, 'failed to download inbound image');
        continue;
      }
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader) {
        const contentLength = Number(contentLengthHeader);
        if (Number.isFinite(contentLength) && contentLength > params.maxBytes) {
          params.logger.warn({ url, contentLength }, 'skip inbound image because it is too large');
          continue;
        }
      }
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > params.maxBytes) {
        params.logger.warn({ url, bytes: arrayBuffer.byteLength }, 'skip inbound image because it exceeds max bytes');
        continue;
      }
      images.push({
        mimeType: inferMimeType(response.headers.get('content-type'), url),
        base64Data: Buffer.from(arrayBuffer).toString('base64'),
        sourceUrl: url,
      });
    } catch (error) {
      params.logger.warn(
        { url, error: error instanceof Error ? error.message : String(error) },
        'failed to fetch inbound image',
      );
    }
  }

  return images;
}
