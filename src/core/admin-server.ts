import { createServer, type Server } from 'node:http';
import type { Logger } from 'pino';

export interface AdminServerDeps {
  host: string;
  port: number;
  logger: Logger;
  getStatus: () => Record<string, unknown>;
}

export class AdminServer {
  private server: Server | null = null;

  constructor(private readonly deps: AdminServerDeps) {}

  async start(): Promise<void> {
    if (this.server) {
      return;
    }

    this.server = createServer((req, res) => {
      if (req.url === '/healthz') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      if (req.url === '/readyz' || req.url === '/status') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(this.deps.getStatus(), null, 2));
        return;
      }
      res.statusCode = 404;
      res.end('Not found');
    });

    await new Promise<void>((resolve, reject) => {
      this.server?.once('error', reject);
      this.server?.listen(this.deps.port, this.deps.host, () => {
        this.server?.off('error', reject);
        resolve();
      });
    });

    this.deps.logger.info(
      { host: this.deps.host, port: this.deps.port },
      'admin server listening',
    );
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }
    const current = this.server;
    this.server = null;
    await new Promise<void>((resolve, reject) => {
      current.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
