import type { Hooks } from '@/index.ts'

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { HTTPError } from '@/http-error.ts'
import { bfetch } from '@/index.ts'
import { ParseError } from '@/parse-error.ts'
import { createServer, serverUrl } from '~/test/utils/server.ts'

describe('bfetch', () => {
  let listener: Awaited<ReturnType<typeof createServer>>

  beforeAll(async () => {
    listener = await createServer()
  })

  afterAll(() => {
    listener.close().catch(console.error)
  })

  it('hooks: beforeRequest', async () => {
    const hooks: Hooks = {
      beforeRequest(options) { options.method = 'post' },
    }

    const spy = vi.spyOn(hooks, 'beforeRequest')

    const api = bfetch.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    await api('/up', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onRequestError', async () => {
    const hooks: Hooks = { onRequestError() {} }

    const spy = vi.spyOn(hooks, 'onRequestError')

    const api = bfetch.extend({
      baseUrl: 'http://not-found:5533',
      hooks,
    })

    try {
      await api('/up', { hooks })
    }
    catch {}

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onResponse', async () => {
    const hooks: Hooks = { afterResponse() {} }

    const spy = vi.spyOn(hooks, 'afterResponse')

    const api = bfetch.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    try {
      await api('/up', { hooks })
    }
    catch {}

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onResponseParseError', async () => {
    const hooks: Hooks = { onResponseParseError() {} }

    const spy = vi.spyOn(hooks, 'onResponseParseError')

    const api = bfetch.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    try {
      await api('/parse-error', { hooks })
    }
    catch {
    }

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('sends query params', async () => {
    const params = { name: 'ayoub', age: 23 }
    const { data } = await bfetch(serverUrl(listener, '/params'), { query: params })
    expect(data).toMatchObject({ name: 'ayoub', age: '23' })
  })

  it('sends request body', async () => {
    const body = { name: 'ayoub', age: 23 }
    const { data } = await bfetch(serverUrl(listener, '/post'), { data: body, method: 'post' })
    expect(data).toMatchObject(body)
  })

  it('handles form-data body', async () => {
    const body = new FormData()
    body.set('name', 'ayoub')
    const { data } = await bfetch(serverUrl(listener, '/post/form-data'), { data: body, method: 'post' })
    expect(data).toMatchObject({ name: 'ayoub' })
  })

  it('handles form url encoded body', async () => {
    const body = new URLSearchParams()
    body.set('name', 'ayoub')
    const { data } = await bfetch(serverUrl(listener, '/post/form-urlencoded'), { data: body, method: 'post' })
    expect(data).toMatchObject({ name: 'ayoub' })
  })

  it('handles plain text body', async () => {
    const body = 'hello world'
    const { data } = await bfetch(serverUrl(listener, '/post/plain-text'), { data: body, method: 'post' })
    expect(data).toBe(body)
  })

  it('handles bad response', async () => {
    try {
      await bfetch(serverUrl(listener, '/response-error'))
    }
    catch (error) {
      expect(error).instanceOf(HTTPError)
    }
  })

  it('throws parser error', async () => {
    try {
      await bfetch(serverUrl(listener, '/parse-error'))
    }
    catch (error) {
      expect(error).instanceOf(ParseError)
    }
  })

  it('can be aborted', async () => {
    const controller = new AbortController()
    try {
      const res = bfetch(serverUrl(listener, '/long'), { native: { signal: controller.signal } })
      controller.abort()
      await res
    }
    catch (error) {
      expect(error).toBeInstanceOf(DOMException)
      expect((error as DOMException).name).toBe('AbortError')
    }
  })
})
