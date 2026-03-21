import type { AxiosRequestConfig } from 'axios';
import type { SSEConfig } from './shared';
import { AxiosSSEBase } from './shared';

export type { BeforeRequestHook, SSEConfig, SSEMessage } from './shared';

export class AxiosSSE extends AxiosSSEBase {
  constructor(url: string, config?: SSEConfig) {
    super(url, config);
  }

  protected async _connectImpl(config: AxiosRequestConfig): Promise<void> {
    let previousLength = 0;

    await this.axiosInstance(this.url, {
      ...config,
      responseType: 'text',
      onDownloadProgress: (progressEvent) => {
        const responseText = (progressEvent.event.target as XMLHttpRequest)?.responseText ?? '';
        const newData = responseText.slice(previousLength);
        previousLength = responseText.length;

        if (newData.trim())
          this._parseSSEChunk(newData);
      },
    });
  }
}

export default AxiosSSE;
