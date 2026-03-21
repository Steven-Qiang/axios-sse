# Axios-SSE

[![npm version](https://img.shields.io/npm/v/axios-sse.svg)](https://www.npmjs.com/package/axios-sse)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Server-Sent Events (SSE) client built on Axios with auto-reconnect, JSON parsing, and full streaming control.

## Features

- 🚀 **Built on Axios** — leverage interceptors, instances, and all Axios config
- 🌐 **Dual implementation** — XHR (`onDownloadProgress`) in the browser, readable stream in Node.js; bundlers pick the right one automatically via `package.json` `exports`
- 🔄 **Auto Reconnection** — fixed interval or exponential backoff
- 📦 **JSON Auto-parsing** — SSE `data:` fields are parsed automatically
- 🎯 **TypeScript Support** — full type definitions included
- 🔐 **Authentication** — custom headers, `axiosInstance`, or `beforeRequest` hook
- 📡 **Named Events** — route SSE `event:` frames to dedicated handlers via `on()`
- 📬 **POST / any method** — send a request body alongside the SSE stream
- 🔁 **`Last-Event-ID`** — automatically sent on reconnect for server-side resume
- ⚡ **Lifecycle Events** — `error` and `reconnect` events

## Installation

```bash
npm install axios-sse
# or
pnpm add axios-sse
# or
yarn add axios-sse
```

### CDN

```html
<script src="https://unpkg.com/axios"></script>
<script src="https://unpkg.com/axios-sse"></script>
<script>
  const sse = new AxiosSSE('https://sse.dev/test');
  sse.addEventListener('message', (e) => console.log(e.data));
</script>
```

---

## Quick Start

```typescript
import { AxiosSSE } from 'axios-sse';

const sse = new AxiosSSE('https://sse.dev/test');

sse.addEventListener('message', (event) => {
  console.log('Received:', event.data);
});

sse.close();
```

No extra configuration needed — Vite, Webpack, Rollup, and other bundlers automatically select the browser implementation via the `browser` condition in `package.json` exports. Node.js uses the stream-based implementation.

---

## API Reference

### Constructor

```typescript
new AxiosSSE(url: string, config?: SSEConfig)
```

All options are passed through a single `SSEConfig` object.

### SSEConfig

```typescript
interface SSEConfig {
  /** Custom Axios instance (default: axios.create()) */
  axiosInstance?: AxiosInstance;

  /** HTTP method (default: "GET") */
  method?: string;

  /** Query string parameters */
  params?: Record<string, any>;

  /** Request body — typically used with POST */
  data?: any;

  /** Additional request headers */
  headers?: Record<string, string>;

  /** Milliseconds between reconnect attempts (default: 3000) */
  reconnectInterval?: number;

  /** Max reconnect attempts; 0 = disabled (default: 5) */
  maxRetries?: number;

  /** Connect immediately on instantiation (default: true) */
  autoConnect?: boolean;

  /** Double the delay after each failure, up to maxReconnectInterval (default: false) */
  exponentialBackoff?: boolean;

  /** Upper bound for exponential backoff delay in ms (default: 30000) */
  maxReconnectInterval?: number;

  /** Called before every connection attempt; return a partial AxiosRequestConfig */
  beforeRequest?: () => AxiosRequestConfig | Promise<AxiosRequestConfig>;

  /** Shorthand for addEventListener("message", handler) */
  onMessage?: (event: MessageEvent<SSEMessage>) => void;

  /** Shorthand for addEventListener("error", handler) */
  onError?: (event: ErrorEvent) => void;
}
```

### SSEMessage

```typescript
interface SSEMessage {
  id?: string;     // value of the SSE id: field
  event?: string;  // value of the SSE event: field
  data: any;       // parsed JSON or raw string
}
```

### Methods

| Method                | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `connect()`           | Manually start the connection (resets retry counter) |
| `close()`             | Permanently close the connection                     |
| `on(event, handler)`  | Subscribe to a named SSE event type                  |
| `off(event, handler)` | Unsubscribe a handler                                |

### Properties

| Property      | Type                  | Description                             |
| ------------- | --------------------- | --------------------------------------- |
| `readyState`  | `0 \| 1 \| 2`         | `0` connecting, `1` open, `2` closed    |
| `lastEventId` | `string \| undefined` | ID from the last received message frame |

### Events

| Event       | Type                                 | Description                                                |
| ----------- | ------------------------------------ | ---------------------------------------------------------- |
| `message`   | `MessageEvent<SSEMessage>`           | Default SSE frame (no `event:` field, or `event: message`) |
| `<custom>`  | `MessageEvent<SSEMessage>`           | Any named event from the `event:` field                    |
| `error`     | `ErrorEvent`                         | Connection or network error                                |
| `reconnect` | `CustomEvent<{ retryCount, delay }>` | Fired before each reconnect attempt                        |

---

## Usage Examples

### POST with a request body

```typescript
import { AxiosSSE } from 'axios-sse';

const sse = new AxiosSSE('https://api.example.com/chat', {
  method: 'POST',
  data: { prompt: 'Hello, world!' },
  headers: { Authorization: 'Bearer your-token' },
});

sse.addEventListener('message', (event) => {
  console.log(event.data); // SSEMessage
});
```

### Named events with `on()` / `off()`

```typescript
const sse = new AxiosSSE('https://api.example.com/events');

const handler = (event) => console.log('ping!', event.data);

sse.on('ping', handler);

// Later, unsubscribe
sse.off('ping', handler);
```

### Exponential backoff

```typescript
const sse = new AxiosSSE('https://api.example.com/events', {
  reconnectInterval: 1000,
  maxRetries: 6,
  exponentialBackoff: true,
  maxReconnectInterval: 30000,
});

sse.addEventListener('reconnect', (event) => {
  console.log(`Retry #${event.detail.retryCount} in ${event.detail.delay}ms`);
});
```

### Dynamic headers with `beforeRequest`

```typescript
const sse = new AxiosSSE('https://api.example.com/events', {
  beforeRequest: async () => ({
    headers: { Authorization: `Bearer ${await getAccessToken()}` },
  }),
});
```

### `lastEventId` resume

The client automatically sends the `Last-Event-ID` header on every reconnect.
You can also read or pre-seed it manually:

```typescript
const sse = new AxiosSSE('https://api.example.com/events');

sse.addEventListener('message', (event) => {
  console.log('Last ID so far:', sse.lastEventId);
});
```

### `onMessage` / `onError` shorthands

```typescript
const sse = new AxiosSSE('https://api.example.com/events', {
  onMessage: (event) => console.log(event.data),
  onError: (event) => console.error(event.message),
});
```

### Manual connection control

```typescript
const sse = new AxiosSSE('https://api.example.com/events', {
  autoConnect: false,
});

console.log(sse.readyState); // 0

sse.connect();
console.log(sse.readyState); // 1

sse.close();
console.log(sse.readyState); // 2
```

### Custom Axios instance

```typescript
import axios from 'axios';
import { AxiosSSE } from 'axios-sse';

const instance = axios.create({
  baseURL: 'https://api.example.com',
  headers: { Authorization: 'Bearer your-token' },
});

// Interceptors work as expected
instance.interceptors.response.use((res) => res);

const sse = new AxiosSSE('/events', { axiosInstance: instance });
```

---

## How it works

axios-sse ships two separate implementations behind a single import:

| Environment | Mechanism | Condition |
| --- | --- | --- |
| Browser | `axios` + `onDownloadProgress` → `XHR.responseText` incremental reads | `browser` |
| Node.js | `axios` + `responseType: 'stream'` → readable stream `data` events | `require` / `import` |

Bundlers that respect the `browser` field in `package.json` exports (Vite, Webpack, Rollup, esbuild) will automatically use the browser build. No extra configuration or separate import path is needed.

---

## Migrating from v1 to v2

### Breaking changes

#### 1. Constructor signature

v1 supported multiple overloads:

```typescript
// v1
new AxiosSSE(url);
new AxiosSSE(url, config);
new AxiosSSE(url, axiosInstance);
new AxiosSSE(url, axiosInstance, config);
```

v2 uses a single unified config object:

```typescript
// v2
new AxiosSSE(url);
new AxiosSSE(url, config);
```

Migration:

```typescript
// v1
const sse = new AxiosSSE(url, myAxiosInstance, { reconnectInterval: 5000 });

// v2
const sse = new AxiosSSE(url, {
  axiosInstance: myAxiosInstance,
  reconnectInterval: 5000,
});
```

#### 2. `error` event type

v1 dispatched a `CustomEvent` with the error in `event.detail`.  
v2 dispatches a standard `ErrorEvent` with `event.error` and `event.message`.

```typescript
// v1
sse.addEventListener('error', (event) => {
  console.error(event.detail);
});

// v2
sse.addEventListener('error', (event) => {
  console.error(event.error);   // the thrown value
  console.error(event.message); // string description
});
```

---

## Browser Compatibility

Works in all modern browsers that support:

- `EventTarget`
- `AbortController`
- `XMLHttpRequest` (used internally by Axios)

---

## License

MIT © [Steven-Qiang](https://github.com/Steven-Qiang)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details.
