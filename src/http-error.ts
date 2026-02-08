import type { FetchOptions } from './types.ts'

export class HTTPError extends Error {
  constructor(
    public readonly response: Response,
    public readonly request: Request,
    public readonly options: FetchOptions,
  ) {
    super(`Request failed: [${request.method} ${request.url}]`)

    this.name = 'fetch-error'
  }
}
