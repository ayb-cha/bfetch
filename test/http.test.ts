import { describe, expect, it } from 'vitest'
import { detectResponseType } from '../src/http.ts'
import { ResponseType } from '../src/types.ts'

describe('http', () => {
  it('detects json response type', () => {
    expect(detectResponseType('application/json')).toEqual(ResponseType.json)
    expect(detectResponseType('application/json; charset=UTF-8')).toEqual(ResponseType.json)
  })

  it('detects text response type', () => {
    expect(detectResponseType('text/javascript')).toEqual(ResponseType.text)
    expect(detectResponseType('text/plain; charset=UTF-8')).toEqual(ResponseType.text)
  })
})
