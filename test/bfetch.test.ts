import type { Hooks } from '../src/index.ts'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { bfetch } from '../src/index.ts'
import { createServer, serverUrl } from './utils/server.ts'

describe('bfetch', () => {
  let listener: Awaited<ReturnType<typeof createServer>>

  const fetch = vi.spyOn(globalThis, 'fetch')

  beforeAll(async () => {
    listener = await createServer()
  })

  beforeEach(() => {
    fetch.mockClear()
  })

  afterAll(() => {
    listener.close().catch(console.error)
  })

  it('hooks: beforeRequest', async () => {
    const hooks: Hooks = {
      beforeRequest(options) {
        options.method = 'post'
      },
    }

    const spy = vi.spyOn(hooks, 'beforeRequest')

    const api = bfetch.extend(
      {
        baseUrl: serverUrl(listener),
        hooks,
      },
    )

    await api('/up', { hooks })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('hooks: onRequestError', async () => {
    const hooks: Hooks = {
      onRequestError() {
      },
    }

    const spy = vi.spyOn(hooks, 'onRequestError')

    const api = bfetch.extend(
      {
        baseUrl: 'http://not-found:5533',
        hooks,
      },
    )

    try {
      await api('/up', { hooks })
    }
    catch {}

    expect(spy).toHaveBeenCalledTimes(2)
  })
})
