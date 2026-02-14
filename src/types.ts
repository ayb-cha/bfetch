import type { HTTPError } from '@/http-error.ts'

export type Input = string | URL

export interface Fetch {
  <T = any>(input: Input, options?: FetchOptions): Promise<FetchResponse<T>>
  extend: (options: ExtendOptions) => Fetch
}

export interface FetchResponse<T> {
  headers: Headers
  data: T
  status: number
  statusText: string
}

export interface ExtendOptions {
  baseUrl?: string
  headers?: HeadersInit
  query?: Record<string, any>
  hooks?: Hooks
  signal?: AbortSignal
  retry?: Retry
}

export interface FetchOptions {
  method?: RequestHttpVerbs
  query?: Record<string, any>
  headers?: HeadersInit
  data?: string | FormData | URLSearchParams | object
  hooks?: Hooks
  signal?: AbortSignal
  native?: Omit<RequestInit, 'method' | 'headers' | 'body' | 'signal'>
  retry?: Retry
}

// Only expose primitives for now, other pars will be evaluated later base on users needs
export interface Hooks {
  beforeRequest?: (options: Omit<FetchOptions, 'hooks'>) => void
  afterResponse?: (request: Request, response: Response, options: Readonly<FetchOptions>) => void
  onRequestError?: (error: unknown, request: Request, options: Readonly<FetchOptions>) => void
  onResponseError?: (error: HTTPError, response: Response, request: Request, options: Readonly<FetchOptions>) => void
  onResponseParseError?: (error: unknown, response: Response, request: Request, options: Readonly<FetchOptions>) => void
  onRequestRetry?: (retryCount: number, response: Response, request: Request, options: Readonly<FetchOptions>) => void
}

export interface Retry {
  times?: number
  delay?: number
  statusCode?: Set<number>
}

export interface Context {
  method: RequestHttpVerbs
  url: string
  headers: HeadersInit
  query: URLSearchParams
  data: BodyInit | undefined
  options: FetchOptions
  signal?: AbortSignal
  hooks: {
    beforeRequest: Hooks['beforeRequest'][]
    afterResponse: Hooks['afterResponse'][]
    onRequestError: Hooks['onRequestError'][]
    onResponseError: Hooks['onResponseError'][]
    onResponseParseError: Hooks['onResponseParseError'][]
    onRequestRetry: Hooks['onRequestRetry'][]
  }
  retry: Required<Retry>
}

export type RequestHttpVerbs = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'options' | 'trace'

// Other types will be added later
export enum ResponseType {
  text,
  json,
}
