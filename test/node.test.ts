import axios from 'axios';
import { AxiosSSE } from 'axios-sse';
import { describe, expect, inject, it, vi } from 'vitest';

const baseUrl = inject('baseUrl') as string;

describe('axios-sse v2 [node]', () => {
  // ─── Constructor ─────────────────────────────────────────────────────────

  it('should throw when URL is empty', () => {
    expect(() => new AxiosSSE('')).toThrow('URL is required');
  });

  it('should not connect when autoConnect is false', () => {
    const sse = new AxiosSSE(`${baseUrl}/events`, { autoConnect: false });
    expect(sse.readyState).toBe(0);
    sse.close();
  });

  it('should reflect readyState correctly', () => {
    const sse = new AxiosSSE(`${baseUrl}/events`, { autoConnect: false });
    expect(sse.readyState).toBe(0);
    sse.connect();
    expect(sse.readyState).toBe(1);
    sse.close();
    expect(sse.readyState).toBe(2);
  });

  it('should accept a custom axiosInstance in config', () => {
    const sse = new AxiosSSE(`${baseUrl}/events`, {
      axiosInstance: axios.create({ headers: { Authorization: 'Bearer token' } }),
    });
    expect(sse).toBeInstanceOf(AxiosSSE);
    sse.close();
  });

  // ─── Basic streaming ──────────────────────────────────────────────────────

  it('should receive SSE messages via addEventListener', () => {
    const sse = new AxiosSSE(`${baseUrl}/events`);
    const messages: any[] = [];

    return new Promise<void>((resolve) => {
      sse.addEventListener('message', (event: any) => {
        messages.push(event.data);
        if (messages.length === 3) {
          sse.close();
          expect(messages[0].data.count).toBe(0);
          expect(messages[2].data.count).toBe(2);
          resolve();
        }
      });
    });
  });

  it('should receive messages via onMessage shorthand', () => {
    return new Promise<void>((resolve) => {
      const sse = new AxiosSSE(`${baseUrl}/events`, {
        onMessage: (event) => {
          sse.close();
          expect(event.data.data.count).toBe(0);
          resolve();
        },
      });
    });
  });

  // ─── Authentication ───────────────────────────────────────────────────────

  it('should pass auth headers via config.headers', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-auth`, {
      headers: { Authorization: 'Bearer test-token' },
    });

    return new Promise<void>((resolve) => {
      sse.addEventListener('message', (event: any) => {
        sse.close();
        expect(event.data.data.message).toBe('authenticated');
        resolve();
      });
    });
  });

  it('should pass auth headers via axiosInstance', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-auth`, {
      axiosInstance: axios.create({ headers: { Authorization: 'Bearer test-token' } }),
    });

    return new Promise<void>((resolve) => {
      sse.addEventListener('message', (event: any) => {
        sse.close();
        expect(event.data.data.message).toBe('authenticated');
        resolve();
      });
    });
  });

  // ─── id and event fields ──────────────────────────────────────────────────

  it('should parse id and event fields', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-with-id`);
    const messages: any[] = [];

    return new Promise<void>((resolve) => {
      sse.addEventListener('message', (event: any) => {
        messages.push(event.data);
        expect(messages[0].id).toBe('1');
      });

      sse.addEventListener('custom', (event: any) => {
        sse.close();
        expect(event.data.id).toBe('2');
        expect(event.data.event).toBe('custom');
        resolve();
      });
    });
  });

  it('should update lastEventId as messages arrive', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-with-id`);

    return new Promise<void>((resolve) => {
      sse.addEventListener('custom', () => {
        sse.close();
        expect(sse.lastEventId).toBe('2');
        resolve();
      });
    });
  });

  // ─── POST method ──────────────────────────────────────────────────────────

  it('should send a POST request with a body', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-post`, {
      method: 'POST',
      data: { prompt: 'hello' },
    });

    return new Promise<void>((resolve) => {
      sse.addEventListener('message', (event: any) => {
        sse.close();
        expect(event.data.data.prompt).toBe('hello');
        resolve();
      });
    });
  });

  // ─── Named events via on() / off() ───────────────────────────────────────

  it('should route named events with on()', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-named`);
    const received: string[] = [];

    return new Promise<void>((resolve) => {
      sse.on('ping', (event: any) => received.push(event.data.data.type));
      sse.on('pong', (event: any) => {
        received.push(event.data.data.type);
        sse.close();
        expect(received).toEqual(['ping', 'pong']);
        resolve();
      });
    });
  });

  it('should stop receiving events after off()', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-named`, { autoConnect: false });
    const handler = vi.fn();

    sse.on('ping', handler);
    sse.off('ping', handler);
    sse.connect();

    return new Promise<void>((resolve) => {
      sse.on('pong', () => {
        setTimeout(() => {
          sse.close();
          expect(handler).not.toHaveBeenCalled();
          resolve();
        }, 200);
      });
    });
  });

  // ─── lastEventId resume ───────────────────────────────────────────────────

  it('should send Last-Event-ID header on reconnect', () => {
    const sse = new AxiosSSE(`${baseUrl}/events-resume`, { autoConnect: false });
    sse.lastEventId = '42';
    sse.connect();

    return new Promise<void>((resolve) => {
      sse.addEventListener('message', (event: any) => {
        sse.close();
        expect(event.data.data.resumedFrom).toBe('42');
        resolve();
      });
    });
  });

  // ─── beforeRequest hook ───────────────────────────────────────────────────

  it('should call beforeRequest before connecting', () => {
    const hook = vi.fn().mockResolvedValue({
      headers: { Authorization: 'Bearer test-token' },
    });

    const sse = new AxiosSSE(`${baseUrl}/events-auth`, { beforeRequest: hook });

    return new Promise<void>((resolve) => {
      sse.addEventListener('message', (event: any) => {
        sse.close();
        expect(hook).toHaveBeenCalledOnce();
        expect(event.data.data.message).toBe('authenticated');
        resolve();
      });
    });
  });

  // ─── Exponential backoff ──────────────────────────────────────────────────

  it('should use exponential backoff when enabled', () => {
    const sse = new AxiosSSE(`${baseUrl}/no-such-route`, {
      maxRetries: 3,
      reconnectInterval: 50,
      exponentialBackoff: true,
      maxReconnectInterval: 400,
      autoConnect: false,
    });

    const delays: number[] = [];
    sse.addEventListener('reconnect', (event: any) => delays.push(event.detail.delay));
    sse.connect();

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        sse.close();
        expect(delays[0]).toBe(50);
        expect(delays[1]).toBe(100);
        expect(delays[2]).toBe(200);
        resolve();
      }, 1500);
    });
  }, 10000);
});
