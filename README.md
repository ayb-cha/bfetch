# unfee

zero-dependencies TypeScript first tiny `fetch` wrapper that comes with good defaults.

## Quick start

Install:

```bash
pnpm install unfee
```

Import:

```js
import { unfee } from 'unfee'
```

Usage:

```ts
import { unfee } from 'unfee'

const [error, data] = await unfee<{ id: string }>('https://jsonplaceholder.typicode.com/todos/1')
if (error) {
  console.error(error)
  return
}
console.log(data.id)
```

## Benefits over plain `fetch`

- Simple API
- Treat non-2xx status codes as errors
- Retry failed requests
- Timeout support
- Instances with custom defaults
- Hooks
- TypeScript niceties

## JSON

JSON is used by default. `FormData`, `URLSearchParams`, or string bodies override the Content-Type automatically.

**Example:**

```js
const [_, todos] = await unfee('/todos', {
  method: 'GET',
  data: { key: 'value' },
})
```

## Error handling

Error handling is a first-class citizen in `unfee`.

The function returns an error as its first value. When `response.ok` is `false`, the error will be populated accordingly.

```ts
const [error] = await ofetch('https://httpbin.org/status/404')
//      ^
//      fetch-error: Request failed: [GET https://httpbin.org/status/404]
```

`unfee` comes with `HTTPError`, `ParseError` types.

## Timeout

You can specify a timeout (in milliseconds) to automatically abort a request.

```ts
const [error, data] = await ofetch('/api', { timeout: 10000 })
```

## Retry

Requests are automatically retried when certain errors occur. By default, retries are triggered for the following status codes:

- `408` — Request Timeout
- `409` — Conflict
- `425` — Too Early
- `429` — Too Many Requests
- `500` — Internal Server Error
- `502` — Bad Gateway
- `503` — Service Unavailable
- `504` — Gateway Timeout

Requests using the `POST`, `PUT`, `PATCH`, and `DELETE` methods are **not retried by default** to avoid unintended side effects.

You can customize the retry behavior:

```ts
const [error, data] = await unfee('/api', {
  retry: {
    times: 5,
    delay: 500,
    statusCode: new Set([500]),
  },
})
```

## Global instances

You can create a new instance with a custom configuration to share common options across requests.

```ts
import { unfee } from 'unfee'

const api = unfee.extend({
  baseUrl: 'http://api.test/',
  headers: {
    Authorization: 'Bearer xxx',
  },
})

const [error, data] = await api('/endpoint', {
  retry: {
    times: 2,
  },
})
```

## Hooks

You can hook into request lifecycle events using the `hooks` option. Each hook lets you run custom logic at a specific stage of the request.

Available hooks:

- `beforeRequest(options)` — called before the request is sent. Useful for modifying headers or request options.
- `afterResponse(request, response, options)` — called after a successful response is received.
- `onRequestError(error, request, options)` — triggered when a request fails before receiving a response.
- `onResponseError(error, response, request, options)` — triggered when the server responds with an error status.
- `onResponseParseError(error, response, request, options)` — called when response parsing fails.
- `onRequestRetry(retryCount, response, request, options)` — called before a request is retried.

Example:

```ts
const [error, data] = await unfee('/api', {
  hooks: {
    beforeRequest(options) {
      console.log('Sending request...')
    },
    afterResponse(request, response) {
      console.log('Received response:', response.status)
    },
  },
})
```
