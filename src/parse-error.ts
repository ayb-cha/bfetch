import type { FetchOptions } from '@/types.ts'

export class ParseError extends Error {
  constructor(
    public readonly response: Response,
    public readonly request: Request,
    public readonly options: FetchOptions,
    cause?: unknown,
  ) {
    super('Failed to parse response', { cause })

    this.name = 'parse-error'
  }
}
