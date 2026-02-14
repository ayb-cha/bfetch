import type { Input, Retry } from '@/types.ts'
import { RETRY_STATUS_CODES } from '@/constants.ts'

export function mergeURL(path: Input, baseUrl?: string): string {
  if (path instanceof URL) {
    return path.toString()
  }

  if (!baseUrl) {
    return path
  }

  if (path.startsWith(baseUrl)) {
    return path
  }

  if (!baseUrl.endsWith('/') && !path.startsWith('/')) {
    return `${baseUrl}/${path}`
  }

  if (baseUrl.endsWith('/') && path.startsWith('/')) {
    return `${baseUrl.slice(0, -1)}${path}`
  }

  return `${baseUrl}${path}`
}

export function mergeParams(...params: Record<string, any>[]): URLSearchParams {
  const result = new URLSearchParams()

  function normalizeQueryValue(value: unknown): string {
    if (value == null) {
      return ''
    }

    if (typeof value === 'object') {
      return JSON.stringify(value)
    }

    return String(value)
  }

  params.forEach((queries) => {
    for (const [key, value] of Object.entries(queries)) {
      if (value === undefined) {
        result.delete(key)
      }
      else if (Array.isArray(value)) {
        value.forEach(val => result.append(key, val))
      }
      else {
        result.set(key, normalizeQueryValue(value))
      }
    }
  })

  return result
}

export function mergeRetry(...params: Retry[]): Required<Retry> {
  const result: Required<Retry> = {
    times: 1,
    delay: 0,
    statusCode: RETRY_STATUS_CODES,
  }

  for (const param of params) {
    if (param.times !== undefined) {
      result.times = param.times
    }
    if (param.delay !== undefined) {
      result.delay = param.delay
    }
    if (param.statusCode !== undefined) {
      result.statusCode = param.statusCode
    }
  }

  return result
}
