import type { Fetch } from './types.ts'
import { createFetch } from './fetch.ts'

export const bfetch: Fetch = createFetch({})

export * from './types.ts'
