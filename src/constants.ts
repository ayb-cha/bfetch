export const RETRY_STATUS_CODES: Set<number> = new Set([
  408, // Request Timeout
  409, // Conflict
  425, // Too Early
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
])

export const PAYLOAD_METHODS: Set<string> = new Set(['post', 'put', 'patch', 'delete'])

export const TEXT_TYPES: Set<string> = new Set([
  'image/svg',
  'application/xml',
  'application/xhtml',
  'application/html',
])

export const JSON_RESPONSE: RegExp = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(?:;.+)?$/i
