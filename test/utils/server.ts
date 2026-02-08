import { H3, readBody, serve } from 'h3'

export async function createServer(): Promise<ReturnType<typeof serve>> {
  const app = new H3({ debug: true })
    .all('/up', () => 'up')
    .all('/params', event => Object.fromEntries(event.url.searchParams))
    .all('/post', event => ({ body: readBody(event) }))
    .all('/200', () => null)

  return await serve(app, { port: 0, hostname: 'localhost' }).ready()
}
