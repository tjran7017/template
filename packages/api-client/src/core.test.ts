import { describe, it, expect, vi } from 'vitest'

import { createServiceClient } from './core.js'
import { ApiError } from './errors.js'

describe('createServiceClient', () => {
  it('substitutes path parameters in URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: '1' }), { status: 200 }))
    const client = createServiceClient<{
      '/users/{id}': {
        get: { responses: { 200: { content: { 'application/json': { id: string } } } } }
      }
    }>({
      baseUrl: 'https://example.com',
      fetch: fetchMock,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await client.request('/users/{id}' as any, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      method: 'get' as any,
      params: { path: { id: '1' } },
    })

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/users/1', expect.any(Object))
  })

  it('calls onUnauthorized on 401 response', async () => {
    const onUnauthorized = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    const client = createServiceClient<{
      '/test': { get: { responses: { 200: { content: { 'application/json': unknown } } } } }
    }>({
      baseUrl: 'https://example.com',
      onUnauthorized,
      fetch: fetchMock,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(client.request('/test' as any, { method: 'get' as any })).rejects.toBeInstanceOf(
      ApiError,
    )
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('injects Authorization header when getAuthToken returns a token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const client = createServiceClient<{
      '/test': { get: { responses: { 200: { content: { 'application/json': unknown } } } } }
    }>({
      baseUrl: 'https://example.com',
      getAuthToken: () => 'my-token',
      fetch: fetchMock,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await client.request('/test' as any, { method: 'get' as any })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    )
  })

  it('runs onRequest middleware', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const client = createServiceClient<{
      '/test': { get: { responses: { 200: { content: { 'application/json': unknown } } } } }
    }>({
      baseUrl: 'https://example.com',
      fetch: fetchMock,
      middleware: [
        {
          onRequest: (init) => ({ ...init, headers: { ...init.headers, 'X-Custom': 'value' } }),
        },
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await client.request('/test' as any, { method: 'get' as any })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Custom': 'value' }),
      }),
    )
  })

  it('throws ApiError for non-ok responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ message: 'Server error' }), { status: 500 }))
    const client = createServiceClient<{
      '/test': { get: { responses: { 200: { content: { 'application/json': unknown } } } } }
    }>({
      baseUrl: 'https://example.com',
      fetch: fetchMock,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(client.request('/test' as any, { method: 'get' as any })).rejects.toBeInstanceOf(
      ApiError,
    )
  })
})
