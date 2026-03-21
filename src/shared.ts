import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios, { CanceledError } from 'axios';

// ─── Public Types ────────────────────────────────────────────────────────────

export interface SSEMessage {
  id?: string;
  event?: string;
  data: any;
}

export type BeforeRequestHook = () => AxiosRequestConfig | Promise<AxiosRequestConfig>;

export interface SSEConfig {
  axiosInstance?: AxiosInstance;
  method?: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  reconnectInterval?: number;
  maxRetries?: number;
  autoConnect?: boolean;
  exponentialBackoff?: boolean;
  maxReconnectInterval?: number;
  beforeRequest?: BeforeRequestHook;
  onMessage?: (event: MessageEvent<SSEMessage>) => void;
  onError?: (event: ErrorEvent) => void;
}

// ─── Base Class ──────────────────────────────────────────────────────────────

export abstract class AxiosSSEBase extends EventTarget {
  protected readonly axiosInstance: AxiosInstance;
  protected readonly url: string;
  protected readonly config: Required<
    Omit<SSEConfig, 'axiosInstance' | 'beforeRequest' | 'onMessage' | 'onError' | 'params' | 'data' | 'headers'>
  >
  & Pick<SSEConfig, 'beforeRequest' | 'params' | 'data' | 'headers'>;

  protected controller?: AbortController;
  protected isClosed = false;
  protected retryCount = 0;

  public lastEventId: string | undefined;

  constructor(url: string, config: SSEConfig = {}) {
    super();

    if (!url)
      throw new Error('URL is required');

    this.url = url;

    const { axiosInstance, onMessage, onError, ...rest } = config;

    this.axiosInstance = axiosInstance ?? axios.create();
    this.config = {
      method: 'GET',
      reconnectInterval: 3000,
      maxRetries: 5,
      autoConnect: true,
      exponentialBackoff: false,
      maxReconnectInterval: 30000,
      ...rest,
    };

    if (onMessage)
      this.addEventListener('message', onMessage as EventListener);
    if (onError)
      this.addEventListener('error', onError as EventListener);

    if (this.config.autoConnect)
      this._connect();
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  public connect(): void {
    if (!this.isClosed) {
      this.retryCount = 0;
      this._connect();
    }
  }

  public close(): void {
    this.isClosed = true;
    this.controller?.abort();
  }

  public get readyState(): number {
    return this.isClosed ? 2 : this.controller ? 1 : 0;
  }

  public on(eventName: string, handler: (event: MessageEvent<SSEMessage>) => void): void {
    this.addEventListener(eventName, handler as EventListener);
  }

  public off(eventName: string, handler: (event: MessageEvent<SSEMessage>) => void): void {
    this.removeEventListener(eventName, handler as EventListener);
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  protected async _connect(): Promise<void> {
    if (this.isClosed)
      return;

    this.controller = new AbortController();

    try {
      const hookConfig = this.config.beforeRequest ? await this.config.beforeRequest() : {};

      const baseConfig: AxiosRequestConfig = {
        method: this.config.method,
        params: this.config.params,
        data: this.config.data,
        headers: {
          ...(this.lastEventId ? { 'Last-Event-ID': this.lastEventId } : {}),
          ...this.config.headers,
          ...hookConfig.headers,
        },
        signal: this.controller.signal,
        timeout: 0,
        ...Object.fromEntries(Object.entries(hookConfig).filter(([k]) => k !== 'signal' && k !== 'headers')),
      };

      await this._connectImpl(baseConfig);
      this.retryCount = 0;
    }
    catch (error) {
      if (this.isClosed || error instanceof CanceledError)
        return;
      if (error instanceof Error && error.name === 'AbortError')
        return;
      this._handleError(error);
    }
  }

  /** Implemented by subclasses for each environment. */
  protected abstract _connectImpl(config: AxiosRequestConfig): Promise<void>;

  protected _parseSSEChunk(chunk: string): void {
    const lines = chunk.split('\n');
    let frame: Partial<SSEMessage> = {};

    for (const line of lines) {
      if (line.startsWith('data:')) {
        frame.data = this._tryParseJSON(line.substring(5).trim());
      }
      else if (line.startsWith('id:')) {
        frame.id = line.substring(3).trim();
        this.lastEventId = frame.id;
      }
      else if (line.startsWith('event:')) {
        frame.event = line.substring(6).trim();
      }
      else if (line.trim() === '' && frame.data !== undefined) {
        const eventType = frame.event ?? 'message';
        this.dispatchEvent(new MessageEvent(eventType, { data: frame as SSEMessage }));
        frame = {};
      }
    }
  }

  private _tryParseJSON(value: string): any {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed : value;
    }
    catch {
      return value;
    }
  }

  protected _handleError(error: unknown): void {
    const errorEvent
      = typeof ErrorEvent !== 'undefined'
        ? new ErrorEvent('error', {
            error,
            message: error instanceof Error ? error.message : String(error),
          })
        : Object.assign(new Event('error'), {
            error,
            message: error instanceof Error ? error.message : String(error),
          });
    this.dispatchEvent(errorEvent);

    if (this.config.maxRetries === 0 || this.retryCount >= this.config.maxRetries)
      return;

    this.retryCount++;

    const delay = this.config.exponentialBackoff
      ? Math.min(this.config.reconnectInterval * 2 ** (this.retryCount - 1), this.config.maxReconnectInterval)
      : this.config.reconnectInterval;

    this.dispatchEvent(
      new CustomEvent('reconnect', {
        detail: { retryCount: this.retryCount, delay },
      }),
    );

    setTimeout(() => this._connect(), delay);
  }
}
