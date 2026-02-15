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
import { unfee } from '@/index.ts'
import { ParseError } from '@/parse-error.ts'
import { createServer, serverUrl } from '~/test/utils/server.ts'

describe('unfee', () => {
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

    const api = unfee.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    await api('/up', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onRequestError', async () => {
    const hooks: Hooks = { onRequestError() {} }

    const spy = vi.spyOn(hooks, 'onRequestError')

    const api = unfee.extend({
      baseUrl: 'http://localhost:55933', // hopefully this port is not used
      hooks,
    })

    await api('/up', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onResponse', async () => {
    const hooks: Hooks = { afterResponse() {} }

    const spy = vi.spyOn(hooks, 'afterResponse')

    const api = unfee.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    await api('/up', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onResponseParseError', async () => {
    const hooks: Hooks = { onResponseParseError() {} }

    const spy = vi.spyOn(hooks, 'onResponseParseError')

    const api = unfee.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    await api('/parse-error', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onRequestRetry', async () => {
    const hooks: Hooks = { onRequestRetry() {} }

    const spy = vi.spyOn(hooks, 'onRequestRetry')

    const api = unfee.extend({
      baseUrl: serverUrl(listener),
      hooks,
    })

    await api('/500', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('sends query params', async () => {
    const params = { name: 'ayoub', age: 23 }
    const [error, data] = await unfee<typeof params>(serverUrl(listener, '/params'), { query: params })

    expect(error).toBeNull()
    expect(data).toMatchObject({ name: 'ayoub', age: '23' })
  })

  it('sends request body', async () => {
    const body = { name: 'ayoub', age: 23 }
    const [error, data] = await unfee<typeof body>(serverUrl(listener, '/post'), { data: body, method: 'post' })
    expect(error).toBeNull()
    expect(data).toMatchObject(body)
  })

  it('handles form-data body', async () => {
    const body = new FormData()
    body.set('name', 'ayoub')
    const [error, data] = await unfee(serverUrl(listener, '/post/form-data'), { data: body, method: 'post' })
    expect(error).toBeNull()
    expect(data).toMatchObject({ name: 'ayoub' })
  })

  it('handles form url encoded body', async () => {
    const body = new URLSearchParams()
    body.set('name', 'ayoub')
    const [error, data] = await unfee<Record<string, string>>(serverUrl(listener, '/post/form-urlencoded'), { data: body, method: 'post' })
    expect(error).toBeNull()
    expect(data).toMatchObject({ name: 'ayoub' })
  })

  it('handles plain text body', async () => {
    const body = 'hello world'
    const [error, data] = await unfee<string>(serverUrl(listener, '/post/plain-text'), { data: body, method: 'post' })
    expect(error).toBeNull()
    expect(data).toBe(body)
  })

  it('handles form data response', async () => {
    const [error, data] = await unfee<FormData>(serverUrl(listener, '/form-data-response'), { responseType: 'formdata' })
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(FormData)
    expect(data!.get('name')).toEqual('ayoub')
  })

  it('handles array buffer response', async () => {
    const [error, data] = await unfee<ArrayBuffer>(serverUrl(listener, '/array-buffer-response'), { responseType: 'arraybuffer' })
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(data!)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('handles blob response', async () => {
    const [error, data] = await unfee<Blob>(serverUrl(listener, '/blob-response'), { responseType: 'blob' })
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(Blob)
    expect(await data!.text()).toEqual('HI!')
  })

  it('auto detects form data response', async () => {
    const [error, data] = await unfee<FormData>(serverUrl(listener, '/form-data-response'))
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(FormData)
    expect(data!.get('name')).toEqual('ayoub')
  })

  it('auto detects array buffer response', async () => {
    const [error, data] = await unfee<ArrayBuffer>(serverUrl(listener, '/array-buffer-response'))
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(ArrayBuffer)
    expect(new Uint8Array(data!)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('auto detects blob response', async () => {
    const [error, data] = await unfee<Blob>(serverUrl(listener, '/blob-response'))
    expect(error).toBeNull()
    expect(data).toBeInstanceOf(Blob)
    expect(await data!.text()).toEqual('HI!')
  })

  it('handles bad response', async () => {
    const [error] = await unfee(serverUrl(listener, '/403'))
    expect(error).toBeInstanceOf(HTTPError)
  })

  it('throws parser error', async () => {
    const [error] = await unfee(serverUrl(listener, '/parse-error'))
    expect(error).toBeInstanceOf(ParseError)
  })

  it('can be aborted', async () => {
    const controller = new AbortController()
    const res = unfee(serverUrl(listener, '/long'), { signal: controller.signal })
    controller.abort()
    const [error] = await res
    expect(error).toBeInstanceOf(DOMException)
    expect((error as DOMException).name).toBe('AbortError')
  })

  it('times out', async () => {
    const [error] = await unfee(serverUrl(listener, '/long'), { timeout: 100 })
    expect(error).toBeInstanceOf(DOMException)
    expect((error as DOMException).name).toBe('AbortError')
  })

  it('reties requests by default', async () => {
    const hooks: Hooks = { onRequestRetry() {} }

    const spy = vi.spyOn(hooks, 'onRequestRetry')

    await unfee(serverUrl(listener, '/500'), { hooks })

    expect(spy).toHaveBeenCalledOnce()
  })

  it('reties requests', async () => {
    const hooks: Hooks = { onRequestRetry() {} }

    const spy = vi.spyOn(hooks, 'onRequestRetry')

    await unfee(serverUrl(listener, '/500'), {
      hooks,
      retry: {
        times: 5,
        statusCode: new Set([500]),
      },
    })

    expect(spy).toHaveBeenCalledTimes(5)
  })
})
