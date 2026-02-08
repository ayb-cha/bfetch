import type { Context, ExtendOptions, Fetch, FetchOptions, Input } from './types.ts'
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
    },
  }
}

export function createFetch(extendOptions: ExtendOptions): Fetch {
  const $fetch = function (input: Input, options: FetchOptions = {}): void {
    const context = createContext(input, options, extendOptions)

    console.warn(context)
  }

  return Object.assign($fetch, { extend: createFetch })
}
