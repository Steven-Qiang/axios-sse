import type { AxiosInstance } from 'axios';
import axios, { CanceledError } from 'axios';

export interface SSEConfig {
  reconnectInterval?: number;
  maxRetries?: number;
  autoConnect?: boolean;
}

export interface SSEMessage {
  id?: string;
  event?: string;
  data: any;
}

class AxiosSSE extends EventTarget {
  private readonly axiosInstance: AxiosInstance;
  private readonly url: string;
  private readonly config: Required<SSEConfig>;

  private controller?: AbortController;
  private isClosed = false;
  private retryCount = 0;

  constructor(url: string, config?: SSEConfig);
  constructor(url: string, axiosInstance: AxiosInstance, config?: SSEConfig);
  constructor(url: string, configOrInstance?: SSEConfig | AxiosInstance, config?: SSEConfig) {
    super();

    if (!url) {
      throw new Error('URL is required');
    }

    this.url = url;

    let axiosInstance: AxiosInstance;
    let sseConfig: SSEConfig;

    if (configOrInstance && 'request' in configOrInstance) {
      axiosInstance = configOrInstance;
      sseConfig = config || {};
    }
    else {
      axiosInstance = axios.create();
      sseConfig = (configOrInstance as SSEConfig) || {};
    }

    this.axiosInstance = axiosInstance;
    this.config = {
      reconnectInterval: 3000,
      maxRetries: 5,
      autoConnect: true,
      ...sseConfig,
    };

    if (this.config.autoConnect) {
      this._connect();
    }
  }

  public connect(): void {
    if (!this.isClosed) {
      this.retryCount = 0;
      this._connect();
    }
  }

  private async _connect(): Promise<void> {
    if (this.isClosed)
      return;

    this.controller = new AbortController();
    let previousLength = 0;

    try {
      await this.axiosInstance.get(this.url, {
        signal: this.controller.signal,
        timeout: 0,
        responseType: 'text',
        onDownloadProgress: (progressEvent) => {
          const responseText = (progressEvent.event.target as XMLHttpRequest)?.responseText || '';
          const newData = responseText.slice(previousLength);
          previousLength = responseText.length;

          if (newData.trim()) {
            this.parseSSEData(newData);
          }
        },
      });

      this.retryCount = 0;
    }
    catch (error) {
      if (error instanceof CanceledError || this.isClosed)
        return;
      this.handleConnectionError(error);
    }
  }

  private parseSSEData(data: string): void {
    const lines = data.split('\n');
    let message: Partial<SSEMessage> = {};

    for (const line of lines) {
      if (line.startsWith('data:')) {
        const rawData = line.substring(5).trim();
        message.data = this.tryParseJSON(rawData);
      }
      else if (line.startsWith('id:')) {
        message.id = line.substring(3).trim();
      }
      else if (line.startsWith('event:')) {
        message.event = line.substring(6).trim();
      }
      else if (line.trim() === '' && message.data !== undefined) {
        this.dispatchEvent(new MessageEvent('message', {
          data: message as SSEMessage,
        }));
        message = {};
      }
    }
  }

  private tryParseJSON(value: string): any {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed : value;
    }
    catch {
      return value;
    }
  }

  private handleConnectionError(error: unknown): void {
    this.dispatchEvent(new CustomEvent('error', { detail: error }));

    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      setTimeout(() => this._connect(), this.config.reconnectInterval);
    }
  }

  public close(): void {
    this.isClosed = true;
    this.controller?.abort();
  }

  public get readyState(): number {
    return this.isClosed ? 2 : this.controller ? 1 : 0;
  }
}

export default AxiosSSE;
export { AxiosSSE };
