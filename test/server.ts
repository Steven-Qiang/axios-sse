import type { Server } from 'http';
import express from 'express';

export class TestSSEServer {
  private app = express();
  private server?: Server;
  private port = 0;

  constructor() {
    // Allow browser tests (Chromium) to reach the server cross-origin
    this.app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Last-Event-ID');
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    // Basic GET stream — emits 3 counted messages then closes
    this.app.get('/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      let counter = 0;
      const interval = setInterval(() => {
        res.write(`data: {"count": ${counter++}}\n\n`);
        if (counter >= 3) {
          clearInterval(interval);
          res.end();
        }
      }, 100);

      req.on('close', () => clearInterval(interval));
    });

    // Auth-protected GET stream
    this.app.get('/events-auth', (req, res) => {
      if (req.headers.authorization !== 'Bearer test-token') {
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

    // Stream with id and named event fields
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

    // POST stream — echoes the request body back as the first SSE message
    this.app.post('/events-post', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      res.write(`data: ${JSON.stringify(req.body)}\n\n`);
      res.end();
    });

    // Named-event stream — emits two frames with different event types
    this.app.get('/events-named', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      res.write('event: ping\ndata: {"type": "ping"}\n\n');
      res.write('event: pong\ndata: {"type": "pong"}\n\n');
      res.end();
    });

    // lastEventId resume — echoes back the Last-Event-ID header the client sent
    this.app.get('/events-resume', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const lastId = req.headers['last-event-id'] ?? 'none';
      res.write(`data: {"resumedFrom": "${lastId}"}\n\n`);
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
      this.server ? this.server.close(() => resolve()) : resolve();
    });
  }

  getUrl(path = '') {
    return `http://localhost:${this.port}${path}`;
  }
}
