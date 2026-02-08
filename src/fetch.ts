import type { Context, ExtendOptions, Fetch, FetchOptions, FetchResponse, Input } from './types.ts'
import { constructRequest } from './http.ts'
import { mergeParams, mergeURL } from './merge.ts'

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
  else if (typeof options.data === 'string') {
    headers['Content-Type'] = 'text/plain;charset=UTF-8'
    data = options.data
  }
  else if (typeof options.data === 'object') {
    headers['Content-Type'] = 'application/json'
    data = JSON.stringify(options.data)
  }
  else {
    // let the runtime manage the content-type header
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

async function createFetchResponse<T>(response: Response): Promise<FetchResponse<T>> {
  const data = response.text() as T

  const result = {
    data,
    status: response.status,
    headers: response.headers,
    statusText: response.statusText,
  }

  return result
}

export function createFetch(extendOptions: ExtendOptions): Fetch {
  const $fetch = async function <T>(input: Input, options: FetchOptions = {}): Promise<FetchResponse<T>> {
    // call the beforeRequest before creating the context, so changes on the options should take effect
    extendOptions.hooks?.beforeRequest?.(options)
    options.hooks?.beforeRequest?.(options)

    const context = createContext(input, options, extendOptions)
    const request = constructRequest(context)

    try {
      const inflight = await fetch(request)
      return createFetchResponse(inflight)
    }
    catch (error) {
      context.hooks.onRequestError[0]?.(error, request, options)
      context.hooks.onRequestError[1]?.(error, request, options)
      throw error
    }
  }

  return Object.assign($fetch, { extend: createFetch })
}
