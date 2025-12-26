import axios from 'axios';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AxiosSSE } from '../src/index';
import { TestSSEServer } from './server';

describe('axios-sse', () => {
  let server: TestSSEServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = new TestSSEServer();
    baseUrl = await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should throw error without URL', () => {
    expect(() => new AxiosSSE('')).toThrow('URL is required');
  });

  it('should accept custom axios instance', () => {
    const customAxios = axios.create({
      headers: { Authorization: 'Bearer token' },
    });

    const sse = new AxiosSSE(`${baseUrl}/events`, customAxios);
    expect(sse).toBeInstanceOf(AxiosSSE);
    sse.close();
  });

  it('should support autoConnect false', () => {
    const sse = new AxiosSSE(`${baseUrl}/events`, { autoConnect: false });
    expect(sse.readyState).toBe(0);
    sse.close();
  });

  it('should receive SSE messages', async () => {
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

  it('should support authentication headers', async () => {
    const customAxios = axios.create({
      headers: { Authorization: 'Bearer test-token' },
    });

    const sse = new AxiosSSE(`${baseUrl}/events-auth`, customAxios);
    const messages: any[] = [];

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        sse.close();
        resolve();
      }, 1000);

      sse.addEventListener('message', (event: any) => {
        messages.push(event.data);
        clearTimeout(timeout);
        sse.close();
        expect(messages[0].data.message).toBe('authenticated');
        resolve();
      });
    });
  });

  it('should parse SSE messages with id and event', async () => {
    const sse = new AxiosSSE(`${baseUrl}/events-with-id`);
    const messages: any[] = [];

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        sse.close();
        resolve();
      }, 1000);

      sse.addEventListener('message', (event: any) => {
        messages.push(event.data);
        if (messages.length === 2) {
          clearTimeout(timeout);
          sse.close();
          expect(messages[0].id).toBe('1');
          expect(messages[1].event).toBe('custom');
          resolve();
        }
      });
    });
  });
});
