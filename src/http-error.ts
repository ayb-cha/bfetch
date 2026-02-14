import type { FetchOptions } from './types.ts'

export class HTTPError extends Error {
  public readonly status: number
  public readonly statusText: string
  constructor(
    public readonly response: Response,
    public readonly request: Request,
    public readonly options: FetchOptions,
  ) {
    super(`Request failed: [${request.method} ${request.url}]`)

    this.name = 'fetch-error'

    this.status = response.status
    this.statusText = response.statusText
  }
}
