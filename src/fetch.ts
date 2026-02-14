import type { Context, ExtendOptions, Fetch, FetchOptions, FetchResponse, Input } from '@/types.ts'
import { HTTPError } from '@/http-error.ts'
import { constructRequest, detectResponseType } from '@/http.ts'
import { mergeParams, mergeURL } from '@/merge.ts'
import { ParseError } from '@/parse-error.ts'
import { ResponseType } from '@/types.ts'

function createContext(input: Input, options: FetchOptions, extendOption: ExtendOptions): Context {
  let method = 'get'
  let data: Context['data']
  let headers: HeadersInit = {
    Accept: 'application/json, text/plain, */*',
  }

  if (options.method) {
    method = options.method
  }

  if (options.data instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    data = options.data.toString()
  }
  else if (options.data instanceof FormData) {
    // let the runtime manage the content-type header
    data = options.data
  }
  else if (typeof options.data === 'string') {
    headers['Content-Type'] = 'text/plain;charset=UTF-8'
    data = options.data
  }
  else if (typeof options.data === 'object') {
    headers['Content-Type'] = 'application/json'
    data = JSON.stringify(options.data)
  }
  else {
    data = options.data
  }

  headers = { ...headers, ...(options.headers ?? {}) }

  return {
    method: method.toUpperCase(),
    url: mergeURL(input, extendOption.baseUrl),
    query: mergeParams(extendOption.query ?? {}, options.query ?? {}),
    headers,
    data,
    options,
    hooks: {
      onRequestError: [extendOption.hooks?.onRequestError, options.hooks?.onRequestError],
      onResponseError: [extendOption.hooks?.onResponseError, options.hooks?.onResponseError],
      beforeRequest: [extendOption.hooks?.beforeRequest, options.hooks?.beforeRequest],
      afterResponse: [extendOption.hooks?.afterResponse, options.hooks?.afterResponse],
      onResponseParseError: [extendOption.hooks?.onResponseParseError, options.hooks?.onResponseParseError],
    },
  }
}

async function createFetchResponse<T>(response: Response, request: Request, ctx: Context): Promise<FetchResponse<T>> {
  const contentType = detectResponseType(response.headers.get('content-type') ?? 'application/json')

  let data
  try {
    if (contentType === ResponseType.json) {
      data = await response.json() as T
    }
    else {
      data = await response.text() as T
    }
  }
  catch (error) {
    throw new ParseError(response, request, ctx.options, error)
  }

  const result = {
    data: data!,
    status: response.status,
    headers: response.headers,
    statusText: response.statusText,
  }

  return result
}

export function createFetch(extendOptions: ExtendOptions): Fetch {
  const $fetch = async function <T>(input: Input, options: FetchOptions = {}): Promise<FetchResponse<T>> {
    // call the beforeRequest before creating the context, so changes to the options take effect
    extendOptions.hooks?.beforeRequest?.(options)
    options.hooks?.beforeRequest?.(options)

    const context = createContext(input, options, extendOptions)
    const request = constructRequest(context)

    let inflight: Response
    try {
      inflight = await fetch(request)
      if (!inflight.ok) {
        throw new HTTPError(inflight, request, context.options)
      }

      context.hooks.afterResponse[0]?.(request, inflight, options)
      context.hooks.afterResponse[1]?.(request, inflight, options)
      return await createFetchResponse(inflight, request, context)
    }
    catch (error) {
      if (error instanceof ParseError) {
        context.hooks.onResponseParseError[0]?.(error, inflight!, request, options)
        context.hooks.onResponseParseError[1]?.(error, inflight!, request, options)
      }
      else if (error instanceof HTTPError) {
        context.hooks.onResponseError[0]?.(error, inflight!, request, options)
        context.hooks.onResponseError[1]?.(error, inflight!, request, options)
      }
      else {
        context.hooks.onRequestError[0]?.(error, request, options)
        context.hooks.onRequestError[1]?.(error, request, options)
      }
      throw error
    }
  }

  return Object.assign($fetch, { extend: createFetch })
}
