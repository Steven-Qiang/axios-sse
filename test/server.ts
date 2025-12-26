import type { Server } from 'http';
import express from 'express';

export class TestSSEServer {
  private app = express();
  private server?: Server;
  private port = 0;

  constructor() {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.get('/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      let counter = 0;
      const interval = setInterval(() => {
        res.write(`data: {"count": ${counter++}}\n\n`);
        if (counter >= 3) {
          clearInterval(interval);
          res.end();
        }
      }, 100);

      req.on('close', () => {
        clearInterval(interval);
      });
    });

    this.app.get('/events-auth', (req, res) => {
      const auth = req.headers.authorization;
      if (!auth || auth !== 'Bearer test-token') {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      res.write('data: {"message": "authenticated"}\n\n');
      res.end();
    });

    this.app.get('/events-with-id', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      res.write('id: 1\ndata: {"message": "hello"}\n\n');
      res.write('id: 2\nevent: custom\ndata: {"message": "world"}\n\n');
      res.end();
    });
  }

  async start(): Promise<string> {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => {
        this.port = (this.server!.address() as any).port;
        resolve(`http://localhost:${this.port}`);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      }
      else {
        resolve();
      }
    });
  }

  getUrl(path = '') {
    return `http://localhost:${this.port}${path}`;
  }
}
