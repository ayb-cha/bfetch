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
import { bee } from '@/index.ts'
import { ParseError } from '@/parse-error.ts'
import { createServer, serverUrl } from '~/test/utils/server.ts'

describe('bee', () => {
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

    const api = bee.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    await api('/up', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onRequestError', async () => {
    const hooks: Hooks = { onRequestError() {} }

    const spy = vi.spyOn(hooks, 'onRequestError')

    const api = bee.extend({
      baseUrl: 'http://localhost:55933', // hopefully this port is not used
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

    const api = bee.extend({
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

    const api = bee.extend({
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

  it('hooks: onRequestRetry', async () => {
    const hooks: Hooks = { onRequestRetry() {} }

    const spy = vi.spyOn(hooks, 'onRequestRetry')

    const api = bee.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    try {
      await api('/500', { hooks })
    }
    catch {
    }

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('sends query params', async () => {
    const params = { name: 'ayoub', age: 23 }
    const { data } = await bee(serverUrl(listener, '/params'), { query: params })
    expect(data).toMatchObject({ name: 'ayoub', age: '23' })
  })

  it('sends request body', async () => {
    const body = { name: 'ayoub', age: 23 }
    const { data } = await bee(serverUrl(listener, '/post'), { data: body, method: 'post' })
    expect(data).toMatchObject(body)
  })

  it('handles form-data body', async () => {
    const body = new FormData()
    body.set('name', 'ayoub')
    const { data } = await bee(serverUrl(listener, '/post/form-data'), { data: body, method: 'post' })
    expect(data).toMatchObject({ name: 'ayoub' })
  })

  it('handles form url encoded body', async () => {
    const body = new URLSearchParams()
    body.set('name', 'ayoub')
    const { data } = await bee(serverUrl(listener, '/post/form-urlencoded'), { data: body, method: 'post' })
    expect(data).toMatchObject({ name: 'ayoub' })
  })

  it('handles plain text body', async () => {
    const body = 'hello world'
    const { data } = await bee(serverUrl(listener, '/post/plain-text'), { data: body, method: 'post' })
    expect(data).toBe(body)
  })

  it('handles form data response', async () => {
    const { data } = await bee<FormData>(serverUrl(listener, '/form-data-response'), { responseType: 'formdata' })
    expect(data).toBeInstanceOf(FormData)
    expect(data.get('name')).toEqual('ayoub')
  })

  it('handles array buffer response', async () => {
    const { data } = await bee<ArrayBuffer>(serverUrl(listener, '/array-buffer-response'), { responseType: 'arraybuffer' })
    expect(data).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(data)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('handles blob response', async () => {
    const { data } = await bee<Blob>(serverUrl(listener, '/blob-response'), { responseType: 'blob' })
    expect(data).toBeInstanceOf(Blob)
    expect(await data.text()).toEqual('HI!')
  })

  it('handles bad response', async () => {
    try {
      await bee(serverUrl(listener, '/403'))
    }
    catch (error) {
      expect(error).instanceOf(HTTPError)
    }
  })

  it('throws parser error', async () => {
    try {
      await bee(serverUrl(listener, '/parse-error'))
    }
    catch (error) {
      expect(error).instanceOf(ParseError)
    }
  })

  it('can be aborted', async () => {
    const controller = new AbortController()
    try {
      const res = bee(serverUrl(listener, '/long'), { signal: controller.signal })
      controller.abort()
      await res
    }
    catch (error) {
      expect(error).toBeInstanceOf(DOMException)
      expect((error as DOMException).name).toBe('AbortError')
    }
  })

  it('times out', async () => {
    try {
      await bee(serverUrl(listener, '/long'), { timeout: 100 })
    }
    catch (error) {
      expect(error).toBeInstanceOf(DOMException)
      expect((error as DOMException).name).toBe('AbortError')
    }
  })

  it('reties requests by default', async () => {
    const hooks: Hooks = { onRequestRetry() {} }

    const spy = vi.spyOn(hooks, 'onRequestRetry')

    try {
      await bee(serverUrl(listener, '/500'), { hooks })
    }
    catch {
    }

    expect(spy).toHaveBeenCalledOnce()
  })

  it('reties requests', async () => {
    const hooks: Hooks = { onRequestRetry() {} }

    const spy = vi.spyOn(hooks, 'onRequestRetry')

    try {
      await bee(serverUrl(listener, '/500'), {
        hooks,
        retry: {
          times: 5,
          statusCode: new Set([500]),
        },
      })
    }
    catch {
    }

    expect(spy).toHaveBeenCalledTimes(5)
  })
})
