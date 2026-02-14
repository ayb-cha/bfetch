import type { Context } from '@/types.ts'
import { JSON_RESPONSE, TEXT_TYPES } from '@/constants.ts'
import { ResponseType } from '@/types.ts'

export function constructRequest(ctx: Context): Request {
  const query = ctx.query.toString()

  const result = new Request(ctx.url + (query ? `?${query}` : ''), {
    method: ctx.method,
    headers: ctx.headers,
    body: ctx.data,
    ...ctx.options.native,
  })

  return result
}

// To handle: 'arrayBuffer', 'blob', 'formData'
export function detectResponseType(responseTypeHeader: string): ResponseType {
  responseTypeHeader = responseTypeHeader.split(';').shift() || ''
  if (JSON_RESPONSE.test(responseTypeHeader)) {
    return ResponseType.json
  }

  if (TEXT_TYPES.has(responseTypeHeader) || responseTypeHeader.startsWith('text/')) {
    return ResponseType.text
  }

  return ResponseType.text
}
