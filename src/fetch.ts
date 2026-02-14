import type { Context, ExtendOptions, Fetch, FetchOptions, FetchResponse, Input, RequestHttpVerbs } from '@/types.ts'
import { HTTPError } from '@/http-error.ts'
import { constructRequest, detectResponseType } from '@/http.ts'
import { mergeParams, mergeRetry, mergeSignals, mergeURL } from '@/merge.ts'
import { ParseError } from '@/parse-error.ts'
import { ResponseType } from '@/types.ts'
import { isIdempotentRequest } from '@/utils.ts'

function createContext(input: Input, options: FetchOptions, extendOption: ExtendOptions, timeoutSignal: AbortSignal): Context {
  const method: RequestHttpVerbs = options.method ?? 'get'
  let data: Context['data']
  let headers: HeadersInit = {
    Accept: 'application/json, text/plain, */*',
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
    method,
    url: mergeURL(input, extendOption.baseUrl),
    query: mergeParams(extendOption.query ?? {}, options.query ?? {}),
    retry: mergeRetry(extendOption.retry ?? {}, options.retry ?? {}),
    responseType: options.responseType ? ResponseType[options.responseType] : undefined,
    headers,
    data,
    options,
    timeout: options.timeout ?? extendOption.timeout,
    signal: mergeSignals(extendOption.signal, options.signal, timeoutSignal),
    hooks: {
      onRequestError: [extendOption.hooks?.onRequestError, options.hooks?.onRequestError],
      onResponseError: [extendOption.hooks?.onResponseError, options.hooks?.onResponseError],
      beforeRequest: [extendOption.hooks?.beforeRequest, options.hooks?.beforeRequest],
      afterResponse: [extendOption.hooks?.afterResponse, options.hooks?.afterResponse],
      onResponseParseError: [extendOption.hooks?.onResponseParseError, options.hooks?.onResponseParseError],
      onRequestRetry: [extendOption.hooks?.onRequestRetry, options.hooks?.onRequestRetry],
    },
  }
}

async function createFetchResponse<T>(response: Response, request: Request, ctx: Context): Promise<FetchResponse<T>> {
  ctx.hooks.afterResponse[0]?.(request, response, ctx.options)
  ctx.hooks.afterResponse[1]?.(request, response, ctx.options)

  const contentType = ctx.responseType ?? detectResponseType(response.headers.get('content-type') ?? 'application/json')

  let data
  try {
    if (contentType === ResponseType.json) {
      data = await response.json() as T
    }
    else if (contentType === ResponseType.formdata) {
      data = await response.formData() as T
    }
    else if (contentType === ResponseType.arraybuffer) {
      data = await response.arrayBuffer() as T
    }
    else if (contentType === ResponseType.blob) {
      data = await response.blob() as T
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

async function handleFetchError(response: Response, request: Request, ctx: Context, error: unknown, retryCount: number): Promise<never | undefined> {
  if (error instanceof ParseError) {
    ctx.hooks.onResponseParseError[0]?.(error, response, request, ctx.options)
    ctx.hooks.onResponseParseError[1]?.(error, response, request, ctx.options)
  }
  else if (error instanceof HTTPError) {
    ctx.hooks.onResponseError[0]?.(error, response, request, ctx.options)
    ctx.hooks.onResponseError[1]?.(error, response, request, ctx.options)
    if (isIdempotentRequest(ctx.method) && ctx.retry.statusCode.has(response.status) && retryCount < ctx.retry.times) {
      ctx.hooks.onRequestRetry[0]?.(retryCount, response, request, ctx.options)
      ctx.hooks.onRequestRetry[1]?.(retryCount, response, request, ctx.options)
      if (ctx.retry.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, ctx.retry.delay))
      }

      return
    }
  }
  else {
    ctx.hooks.onRequestError[0]?.(error, request, ctx.options)
    ctx.hooks.onRequestError[1]?.(error, request, ctx.options)
  }
  throw error
}

export function createFetch(extendOptions: ExtendOptions): Fetch {
  const $fetch = async function <T>(input: Input, options: FetchOptions = {}): Promise<FetchResponse<T>> {
    let context: Context | null = null
    let maxRetries = 0

    for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
      // call the beforeRequest before creating the context, so changes to the options take effect
      extendOptions.hooks?.beforeRequest?.(options)
      options.hooks?.beforeRequest?.(options)

      const timeoutController = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined
      context = createContext(input, options, extendOptions, timeoutController.signal)
      if (context.timeout) {
        timer = setTimeout(() => {
          timeoutController.abort()
        }, context.timeout)
      }
      maxRetries = context!.retry.times
      const request = constructRequest(context)

      let inflight: Response
      try {
        inflight = await fetch(request)
        if (!inflight.ok) {
          throw new HTTPError(inflight, request, context.options)
        }

        return await createFetchResponse(inflight, request, context)
      }
      catch (error) {
        await handleFetchError(inflight!, request, context, error, retryCount)
      }
      finally {
        clearTimeout(timer)
      }
    }

    // Defensive: make ts happy, this line should never be reached
    throw new Error('Failed to fetch after retries')
  }

  return Object.assign($fetch, { extend: createFetch })
}
