import type { Context } from './types.ts'
import { ResponseType } from './types.ts'

export function constructRequest(ctx: Context): Request {
  const query = ctx.query.toString()

  const result = new Request(ctx.url + (query ? `?${query}` : ''), {
    method: ctx.method,
    headers: ctx.headers,
    body: ctx.data,
  })

  return result
}

// To handle: 'arrayBuffer', 'blob', 'formData'
export function detectResponseType(responseTypeHeader: string): ResponseType {
  const JSON_RESPONSE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(?:;.+)?$/i
  responseTypeHeader = responseTypeHeader.split(';').shift() || ''
  if (JSON_RESPONSE.test(responseTypeHeader)) {
    return ResponseType.json
  }

  // const textTypes = new Set([
  //   'image/svg',
  //   'application/xml',
  //   'application/xhtml',
  //   'application/html',
  // ])

  // if (textTypes.has(responseTypeHeader) || responseTypeHeader.startsWith('text/')) {
  //   return ResponseType.text
  // }

  return ResponseType.text
}
