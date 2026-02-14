import { describe, expect, it } from 'vitest'
import { mergeParams, mergeURL } from '@/merge.ts'

describe('merge', () => {
  describe('path', () => {
    it('merges path with the base', () => {
      const result = 'http://localhost:5566/api/users'

      expect(mergeURL('/users', 'http://localhost:5566/api')).toEqual(result)
      expect(mergeURL('users', 'http://localhost:5566/api')).toEqual(result)
      expect(mergeURL('/users', 'http://localhost:5566/api/')).toEqual(result)
    })

    it('ignores the base path when an instanceof URL is passed', () => {
      expect(mergeURL(new URL('http://localhost:665/api/users'), 'http://localhost:5566/api/')).toEqual('http://localhost:665/api/users')
    })

    it('merges path with the base, when the path contains the base', () => {
      const result = 'http://localhost:5566/api/users'
      expect(mergeURL('http://localhost:5566/api/users', 'http://localhost:5566/api/')).toEqual(result)
      expect(mergeURL('http://localhost:5566/api/users', 'http://localhost:5566/api')).toEqual(result)
    })

    it('it correctly merges the url when the base or the path is `/`', () => {
      expect(mergeURL('/')).toEqual('/')
      expect(mergeURL('/', '/')).toEqual('/')
    })
  })
  describe('query', () => {
    it('merges query params', () => {
      expect(mergeParams({ name: 'ayoub' }).toString()).toEqual('name=ayoub')
      expect(mergeParams({ name: 'ayoub' }, { age: 23 }).toString()).toEqual('name=ayoub&age=23')
    })
  })
  it('merges arrays', () => {
    expect(mergeParams({ skills: ['programming', 'napping'] }).toString()).toEqual('skills=programming&skills=napping')
  })

  it('replaces old values', () => {
    expect(mergeParams({ name: 'old' }, { name: 'ayoub' }).toString()).toEqual('name=ayoub')
  })

  it('deletes old values when `undefined` is the replacement', () => {
    expect(mergeParams({ name: 'ayoub', age: 23 }, { age: undefined }).toString()).toEqual('name=ayoub')
  })

  it('sets the query empty when `null` is the value', () => {
    expect(mergeParams({ skills: null }).toString()).toEqual('skills=')
  })

  it('dose not handle nested objects', () => {
    expect(decodeURIComponent(mergeParams({ movies: { best: 'interstellar' } }).toString())).toEqual('movies={"best":"interstellar"}')
  })
})
