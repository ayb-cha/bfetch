import { H3, HTTPError, readBody, serve } from 'h3'

export async function createServer(): Promise<ReturnType<typeof serve>> {
  const app = new H3({ debug: true })
    .all('/up', () => 'up')
    .get('/params', event => Object.fromEntries(event.url.searchParams))
    .post('/post', event => event.req.json())
    .post('/post/form-data', async event => (Object.fromEntries((await event.req.formData()).entries())))
    .post('/post/form-urlencoded', event => (readBody(event)))
    .post('/post/plain-text', event => event.req.text())
    .all('/200', () => null)
    .all('/500', () => new HTTPError({ statusCode: 500, statusMessage: 'Internal Server Error' }))
    .all('/403', () => new HTTPError({ statusCode: 403, statusMessage: 'Forbidden' }))
    .all('/long', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return null
    })
    .all('/parse-error', () => {
      return new Response('{', {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

  return serve(app, { port: 0, hostname: '127.0.0.1' }).ready()
}

export function serverUrl(listener: ReturnType<typeof serve>, url: string = '/'): string {
  return new URL(url, listener.url!).toString()
}
