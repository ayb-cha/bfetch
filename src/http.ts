import type { Context } from '@/types.ts'
import { JSON_RESPONSE, TEXT_TYPES } from '@/constants.ts'
import { ResponseType } from '@/types.ts'

export function constructRequest(ctx: Context): Request {
  const query = ctx.query.toString()

  const result = new Request(ctx.url + (query ? `?${query}` : ''), {
    method: ctx.method,
    headers: ctx.headers,
    signal: ctx.signal,
    body: ctx.data,
    ...ctx.options.native,
  })

  return result
}

export function detectResponseType(responseTypeHeader: string): ResponseType {
  responseTypeHeader = responseTypeHeader.split(';').shift() || ''
  if (JSON_RESPONSE.test(responseTypeHeader)) {
    return ResponseType.json
  }

  if (TEXT_TYPES.has(responseTypeHeader) || responseTypeHeader.startsWith('text/')) {
    return ResponseType.text
  }

  if (responseTypeHeader.includes('application/octet-stream')) {
    return ResponseType.arraybuffer
  }

  if (responseTypeHeader.includes('multipart/form-data')) {
    return ResponseType.formdata
  }

  return ResponseType.blob
}
