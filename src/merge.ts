import type { Input } from './types.ts'

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
