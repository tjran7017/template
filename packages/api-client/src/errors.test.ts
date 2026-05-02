import { describe, it, expect } from 'vitest'

import { ApiError, isApiError } from './errors'

describe('ApiError', () => {
  it('creates from response with JSON body', async () => {
    const response = new Response(
      JSON.stringify({ code: 'NOT_FOUND', message: 'Resource not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
    const error = await ApiError.from(response)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Resource not found')
  })

  it('falls back to statusText when body is not JSON', async () => {
    const response = new Response('Not Found', {
      status: 404,
      statusText: 'Not Found',
    })
    const error = await ApiError.from(response)
    expect(error.message).toBe('Not Found')
    expect(error.code).toBeUndefined()
  })

  it('has name "ApiError"', async () => {
    const response = new Response(null, { status: 500 })
    const error = await ApiError.from(response)
    expect(error.name).toBe('ApiError')
  })
})

describe('isApiError', () => {
  it('returns true for ApiError instances', async () => {
    const response = new Response(null, { status: 400 })
    const error = await ApiError.from(response)
    expect(isApiError(error)).toBe(true)
  })

  it('returns false for non-ApiError values', () => {
    expect(isApiError(new Error('generic'))).toBe(false)
    expect(isApiError(null)).toBe(false)
    expect(isApiError('string')).toBe(false)
  })
})
