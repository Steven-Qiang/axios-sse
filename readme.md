# axios-sse

[![npm version](https://img.shields.io/npm/v/axios-sse.svg)](https://www.npmjs.com/package/axios-sse)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight Server-Sent Events (SSE) client built on Axios with auto-reconnect and JSON parsing capabilities.

## Features

- 🚀 **Built on Axios** - Leverage the power and flexibility of Axios
- 🔄 **Auto Reconnection** - Automatic reconnection with configurable retry logic
- 📦 **JSON Auto-parsing** - Automatically parse JSON data in SSE messages
- 🎯 **TypeScript Support** - Full TypeScript support with type definitions
- 🔐 **Authentication** - Support for custom headers and authentication
- ⚡ **Lightweight** - Minimal dependencies and small bundle size
- 🛠️ **Flexible Configuration** - Customizable reconnection intervals and retry limits

## Installation

```bash
npm install axios-sse
# or
pnpm install axios-sse
# or
yarn add axios-sse
```

### CDN Usage

```html
<!-- Include Axios first -->
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>
<!-- Then include axios-sse -->
<script src="https://unpkg.com/axios-sse/dist/index.browser.js"></script>

<script>
  const sse = new AxiosSSE('https://api.example.com/events');
  sse.addEventListener('message', (event) => {
    console.log('Received:', event.data);
  });
</script>
```

## Quick Start

```typescript
import { AxiosSSE } from 'axios-sse';

// Basic usage
const sse = new AxiosSSE('https://api.example.com/events');

sse.addEventListener('message', (event) => {
  console.log('Received:', event.data);
});

// Clean up when done
sse.close();
```

## API Reference

### Constructor

The `AxiosSSE` class supports multiple constructor overloads for maximum flexibility:

```typescript
// Basic usage with URL only
new AxiosSSE(url: string)

// With SSE configuration
new AxiosSSE(url: string, config: SSEConfig)

// With custom Axios instance
new AxiosSSE(url: string, axiosInstance: AxiosInstance)

// With custom Axios instance and SSE configuration
new AxiosSSE(url: string, axiosInstance: AxiosInstance, config: SSEConfig)
```

### SSEConfig

```typescript
interface SSEConfig {
  reconnectInterval?: number;  // Reconnection interval in ms (default: 3000)
  maxRetries?: number;         // Maximum retry attempts (default: 5)
  autoConnect?: boolean;       // Auto-connect on instantiation (default: true)
}
```

### Methods

- `connect()` - Manually start the SSE connection
- `close()` - Close the SSE connection
- `readyState` - Get current connection state (0: connecting, 1: open, 2: closed)

### Events

- `message` - Fired when a message is received
- `error` - Fired when an error occurs

## Usage Examples

### Basic Usage

```typescript
import { AxiosSSE } from 'axios-sse';

const sse = new AxiosSSE('https://api.example.com/events');

sse.addEventListener('message', (event) => {
  console.log('Message:', event.data);
});

sse.addEventListener('error', (event) => {
  console.error('Error:', event.detail);
});
```

### With Authentication

```typescript
import axios from 'axios';
import { AxiosSSE } from 'axios-sse';

// Create authenticated Axios instance
const authenticatedAxios = axios.create({
  headers: {
    'Authorization': 'Bearer your-token-here'
  }
});

const sse = new AxiosSSE('https://api.example.com/events', authenticatedAxios);
```

### Custom Configuration

```typescript
import { AxiosSSE } from 'axios-sse';

const sse = new AxiosSSE('https://api.example.com/events', {
  reconnectInterval: 5000,  // Retry every 5 seconds
  maxRetries: 10,           // Maximum 10 retry attempts
  autoConnect: false        // Don't connect automatically
});

// Manually start connection
sse.connect();
```

### Manual Connection Control

```typescript
import { AxiosSSE } from 'axios-sse';

// Create instance without auto-connecting
const sse = new AxiosSSE('https://api.example.com/events', {
  autoConnect: false
});

// Check connection state
console.log(sse.readyState); // 0 (not connected)

// Start connection when ready
sse.connect();
console.log(sse.readyState); // 1 (connected)

// Close connection
sse.close();
console.log(sse.readyState); // 2 (closed)
```

### Advanced Usage with Custom Axios Configuration

```typescript
import axios from 'axios';
import { AxiosSSE } from 'axios-sse';

const customAxios = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer token',
    'Custom-Header': 'value'
  },
  timeout: 30000
});

const sse = new AxiosSSE('/events', customAxios, {
  reconnectInterval: 2000,
  maxRetries: 3
});
```

## SSE Message Format

The client automatically parses SSE messages according to the standard format:

```
id: message-id
event: custom-event-type
data: {"key": "value"}

```

The parsed message will have the following structure:

```typescript
interface SSEMessage {
  id?: string;      // Message ID (if provided)
  event?: string;   // Event type (if provided)
  data: any;        // Parsed JSON data or raw string
}
```

## Error Handling

```typescript
import { AxiosSSE } from 'axios-sse';

const sse = new AxiosSSE('https://api.example.com/events');

sse.addEventListener('error', (event) => {
  console.error('SSE Error:', event.detail);
  
  // The client will automatically attempt to reconnect
  // based on the configured retry settings
});
```

## TypeScript Support

This package includes full TypeScript support with type definitions:

```typescript
import { AxiosSSE, SSEConfig, SSEMessage } from 'axios-sse';
import { AxiosInstance } from 'axios';

const config: SSEConfig = {
  reconnectInterval: 3000,
  maxRetries: 5,
  autoConnect: true
};

const sse = new AxiosSSE('https://api.example.com/events', config);

sse.addEventListener('message', (event: MessageEvent) => {
  const message: SSEMessage = event.data;
  console.log(message.data);
});
```

## Browser Compatibility

This package works in all modern browsers that support:
- EventTarget API
- AbortController API
- Axios requirements

## License

MIT © [Steven-Qiang](https://github.com/Steven-Qiang)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details about changes in each version.