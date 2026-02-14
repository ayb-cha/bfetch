import type { RequestHttpVerbs } from '@/types.ts'
import { PAYLOAD_METHODS } from '@/constants.ts'

export function isIdempotentRequest(method: RequestHttpVerbs): boolean {
  return !PAYLOAD_METHODS.has(method)
}
