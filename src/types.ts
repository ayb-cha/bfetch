export type Input = string | URL

export interface Fetch {
  <_T>(input: Input, options?: FetchOptions): void
  extend: (options: ExtendOptions) => Fetch
}

export interface ExtendOptions {
  baseUrl?: string
  headers?: HeadersInit
  query?: Record<string, any>
  hooks?: Hooks
}

export interface FetchOptions {
  method?: RequestHttpVerbs
  query?: Record<string, any>
  headers?: HeadersInit
  data?: string | FormData | URLSearchParams
  hooks?: Hooks
}

export interface Hooks {
  beforeRequest?: () => void
  afterResponse?: () => void
  onRequestError?: () => void
  onResponseError?: () => void
}

export interface Context {
  method: string
  url: string
  headers: HeadersInit
  query: URLSearchParams
  data: FetchOptions['data']
  options: FetchOptions
  hooks: {
    beforeRequest: Hooks['beforeRequest'][]
    afterResponse: Hooks['afterResponse'][]
    onRequestError: Hooks['onRequestError'][]
    onResponseError: Hooks['onResponseError'][]
  }
}

export type RequestHttpVerbs = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'options' | 'trace'
