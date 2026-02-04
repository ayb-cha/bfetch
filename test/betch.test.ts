import { H3, readBody, serve } from 'h3'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest'

describe('bfetch', () => {
  let listener: ReturnType<typeof serve>
  const _url = (url: string = '/'): string => listener.url! + (url.replace(/^\//, '') || '')

  beforeAll(async () => {
    const app = new H3({ debug: true })
      .all('/up', () => 'up')
      .all('/params', event => Object.fromEntries(event.url.searchParams))
      .all('/post', event => ({ body: readBody(event) }))
      .all('/200', () => null)

    listener = await serve(app, { port: 0, hostname: 'localhost' }).ready()
  })

  afterAll(() => {
    listener.close().catch(console.error)
  })

  it('ok', async () => {
    expect('ok').to.equal('ok')
  })
})
