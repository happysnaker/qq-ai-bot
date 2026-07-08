import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { URL } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import type { OneBotActionResponse, TransportStatusPatch } from '../../types/onebot.js';

export type ActionTransport = {
  sendAction: (
    action: string,
    params: Record<string, unknown>,
  ) => Promise<OneBotActionResponse>;
  close: () => Promise<void>;
  isReady: () => boolean;
};

type WsHooks = {
  onEvent: (payload: unknown) => Promise<void> | void;
  onStatus?: (patch: TransportStatusPatch) => void;
};

type ForwardWsParams = WsHooks & {
  url: string;
  accessToken?: string;
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
};

type ReverseWsParams = WsHooks & {
  host: string;
  port: number;
  path: string;
  accessToken?: string;
};

type HttpIngressParams = WsHooks & {
  host: string;
  port: number;
  path: string;
  accessToken?: string;
};

type PendingAction = {
  resolve: (value: OneBotActionResponse) => void;
  reject: (reason: unknown) => void;
};

function buildBearerHeaders(accessToken?: string): Record<string, string> | undefined {
  if (!accessToken) {
    return undefined;
  }
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function readRequestBearer(req: IncomingMessage): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth !== 'string') {
    return undefined;
  }

  const [scheme, ...tokenParts] = auth.trim().split(/\s+/u);
  if (scheme?.toLowerCase() !== 'bearer' || tokenParts.length === 0) {
    return undefined;
  }

  const token = tokenParts.join(' ').trim();
  return token.length > 0 ? token : undefined;
}

function requestTokenMatches(req: IncomingMessage, accessToken?: string): boolean {
  if (!accessToken) {
    return true;
  }
  const bearer = readRequestBearer(req);
  if (bearer === accessToken) {
    return true;
  }
  const parsedUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  return parsedUrl.searchParams.get('access_token') === accessToken;
}

function requestPathMatches(req: IncomingMessage, expectedPath: string): boolean {
  const parsedUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  return parsedUrl.pathname === expectedPath;
}

class OneBotWsSession implements ActionTransport {
  private socket: WebSocket | null = null;
  private readonly pending = new Map<string, PendingAction>();
  private readonly hooks: WsHooks;

  constructor(hooks: WsHooks) {
    this.hooks = hooks;
  }

  setSocket(next: WebSocket): void {
    if (this.socket === next) {
      return;
    }

    this.socket = next;
    next.on('message', (data) => {
      void this.handleMessage(data.toString());
    });
    next.on('close', (code, reason) => {
      this.rejectPending(new Error(`websocket closed (${code}): ${reason.toString()}`));
      this.socket = null;
      this.hooks.onStatus?.({
        connected: false,
        lastDisconnect: `code=${code}`,
      });
    });
    next.on('error', (error) => {
      this.hooks.onStatus?.({
        lastError: error instanceof Error ? error.message : String(error),
      });
    });
    this.hooks.onStatus?.({
      connected: true,
      lastConnectedAt: Date.now(),
      lastError: null,
    });
  }

  isReady(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  async close(): Promise<void> {
    this.rejectPending(new Error('websocket session closed'));
    if (!this.socket) {
      return;
    }
    const current = this.socket;
    this.socket = null;
    current.close();
    if (current.readyState !== WebSocket.CLOSED) {
      await once(current, 'close').catch(() => undefined);
    }
  }

  async sendAction(action: string, params: Record<string, unknown>): Promise<OneBotActionResponse> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('websocket transport is not connected');
    }

    const echo = `${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
    const payload = JSON.stringify({ action, params, echo });
    const response = await new Promise<OneBotActionResponse>((resolve, reject) => {
      this.pending.set(echo, { resolve, reject });
      this.socket?.send(payload, (error) => {
        if (error) {
          this.pending.delete(echo);
          reject(error);
        }
      });
    });
    this.hooks.onStatus?.({
      lastOutboundAt: Date.now(),
    });
    return response;
  }

  private rejectPending(error: Error): void {
    for (const { reject } of this.pending.values()) {
      reject(error);
    }
    this.pending.clear();
  }

  private async handleMessage(text: string): Promise<void> {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      this.hooks.onStatus?.({
        lastError: 'received invalid JSON from OneBot transport',
      });
      return;
    }

    const echo = typeof payload.echo === 'string' ? payload.echo : undefined;
    if (echo && this.pending.has(echo)) {
      const pending = this.pending.get(echo);
      this.pending.delete(echo);
      pending?.resolve(payload as OneBotActionResponse);
      return;
    }

    this.hooks.onStatus?.({
      lastInboundAt: Date.now(),
      lastEventAt: Date.now(),
    });
    await this.hooks.onEvent(payload);
  }
}

export function startForwardWsTransport(params: ForwardWsParams): ActionTransport {
  const session = new OneBotWsSession({
    onEvent: params.onEvent,
    onStatus: params.onStatus,
  });
  const reconnectBaseMs = params.reconnectBaseMs ?? 500;
  const reconnectMaxMs = params.reconnectMaxMs ?? 10_000;
  let closed = false;
  let reconnectAttempt = 0;
  let reconnectTimer: NodeJS.Timeout | null = null;

  const connect = (): void => {
    if (closed) {
      return;
    }
    const socket = new WebSocket(params.url, {
      headers: buildBearerHeaders(params.accessToken),
    });
    socket.once('open', () => {
      reconnectAttempt = 0;
      session.setSocket(socket);
      params.onStatus?.({
        reconnectAttempts: 0,
      });
    });
    socket.once('close', () => {
      if (closed) {
        return;
      }
      reconnectAttempt += 1;
      const delay = Math.min(
        reconnectMaxMs,
        reconnectBaseMs * 2 ** Math.max(0, reconnectAttempt - 1),
      );
      params.onStatus?.({
        connected: false,
        reconnectAttempts: reconnectAttempt,
      });
      reconnectTimer = setTimeout(connect, delay);
    });
    socket.once('error', (error) => {
      params.onStatus?.({
        lastError: error instanceof Error ? error.message : String(error),
      });
    });
  };

  connect();

  return {
    sendAction: session.sendAction.bind(session),
    isReady: session.isReady.bind(session),
    close: async () => {
      closed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      await session.close();
    },
  };
}

export async function startReverseWsTransport(
  params: ReverseWsParams,
): Promise<ActionTransport & { server: Server }> {
  const session = new OneBotWsSession({
    onEvent: params.onEvent,
    onStatus: params.onStatus,
  });
  const wsServer = new WebSocketServer({ noServer: true });
  const server = createServer((_req, res) => {
    res.statusCode = 404;
    res.end('Not found');
  });

  server.on('upgrade', (req, socket, head) => {
    if (!requestPathMatches(req, params.path)) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }
    if (!requestTokenMatches(req, params.accessToken)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wsServer.handleUpgrade(req, socket, head, (client) => {
      wsServer.emit('connection', client, req);
    });
  });

  wsServer.on('connection', (client) => {
    session.setSocket(client as WebSocket);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(params.port, params.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return {
    server,
    sendAction: session.sendAction.bind(session),
    isReady: session.isReady.bind(session),
    close: async () => {
      await session.close();
      wsServer.close();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function readRequestJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString('utf8');
  return body.length > 0 ? JSON.parse(body) : {};
}

function writeJson(res: ServerResponse, statusCode: number, payload: Record<string, unknown>): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

export async function startHttpIngressServer(
  params: HttpIngressParams,
): Promise<{ close: () => Promise<void>; isReady: () => boolean; server: Server }> {
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || !requestPathMatches(req, params.path)) {
      writeJson(res, 404, { ok: false, error: 'not_found' });
      return;
    }
    if (!requestTokenMatches(req, params.accessToken)) {
      writeJson(res, 401, { ok: false, error: 'unauthorized' });
      return;
    }
    try {
      const payload = await readRequestJson(req);
      params.onStatus?.({
        lastInboundAt: Date.now(),
        lastEventAt: Date.now(),
      });
      await params.onEvent(payload);
      res.statusCode = 204;
      res.end();
    } catch {
      writeJson(res, 400, {
        ok: false,
        error: 'invalid_request',
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(params.port, params.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return {
    server,
    isReady: () => true,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
