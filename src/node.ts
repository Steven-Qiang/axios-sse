import type { AxiosRequestConfig } from 'axios';
import type { SSEConfig } from './shared';
import { AxiosSSEBase } from './shared';

export type { BeforeRequestHook, SSEConfig, SSEMessage } from './shared';

export class AxiosSSE extends AxiosSSEBase {
  constructor(url: string, config?: SSEConfig) {
    super(url, config);
  }

  protected async _connectImpl(config: AxiosRequestConfig): Promise<void> {
    const response = await this.axiosInstance(this.url, {
      ...config,
      responseType: 'stream',
    });

    await new Promise<void>((resolve, reject) => {
      const stream = response.data as import('node:stream').Readable;
      let buffer = '';

      stream.on('data', (chunk: import('node:buffer').Buffer | string) => {
        buffer += chunk.toString();
        const boundary = buffer.lastIndexOf('\n\n');
        if (boundary !== -1) {
          this._parseSSEChunk(buffer.slice(0, boundary + 2));
          buffer = buffer.slice(boundary + 2);
        }
      });

      stream.on('end', resolve);
      stream.on('error', reject);

      this.controller!.signal.addEventListener('abort', () => {
        stream.destroy();
        resolve();
      });
    });
  }
}

export default AxiosSSE;
