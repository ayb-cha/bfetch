import { H3, readBody, serve } from 'h3'

export async function createServer(): Promise<ReturnType<typeof serve>> {
  const app = new H3({ debug: true })
    .all('/up', () => 'up')
    .get('/params', event => Object.fromEntries(event.url.searchParams))
    .post('/post', event => ({ body: readBody(event) }))
    .all('/200', () => null)

  return serve(app, { port: 0, hostname: '127.0.0.1' }).ready()
}

export function serverUrl(listener: ReturnType<typeof serve>, url: string = '/'): string {
  return new URL(url, listener.url!).toString()
}
