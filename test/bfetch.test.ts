import type { serve } from 'h3'
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from 'vitest'
import { bfetch } from '../src/index.ts'
import { createServer } from './utils/server.ts'

describe('bfetch', () => {
  let listener: ReturnType<typeof serve>
  const serverUrl = (url: string = '/'): string => listener.url! + (url.replace(/^\//, '') || '')

  beforeAll(async () => {
    listener = await createServer()
  })

  afterAll(() => {
    listener.close().catch(console.error)
  })

  it('ok', async () => {
    const api = bfetch.extend({ baseUrl: serverUrl() })

    api('/up')
  })
})
