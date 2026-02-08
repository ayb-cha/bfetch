import type { Context } from './types.ts'

export function constructRequest(ctx: Context): Request {
  const query = ctx.query.toString()
  const result = new Request(ctx.url + query, {
    method: ctx.method,
    headers: ctx.headers,
    body: ctx.data,
  })

  return result
}
