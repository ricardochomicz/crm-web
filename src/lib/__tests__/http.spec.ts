import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, mutate, request } from '../http'
afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
})
describe('HTTP session client', () => {
  it('initializes CSRF and sends decoded token with cookies', async () => {
    document.cookie = 'XSRF-TOKEN=token%3Dvalue; path=/'
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await mutate('/api/v1/auth/login', { email: 'ana@example.test', password: 'password' })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/sanctum/csrf-cookie')
    const options = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect(new Headers(options.headers).get('X-XSRF-TOKEN')).toBe('token=value')
    expect(options.credentials).toBe('include')
  })
  it('retains field errors for validation feedback', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ message: 'Invalid', errors: { email: ['E-mail inválido.'] } }),
            { status: 422 },
          ),
        ),
    )
    await expect(request('/api/v1/auth/login')).rejects.toMatchObject({
      status: 422,
      errors: { email: ['E-mail inválido.'] },
    })
  })
  it('signals expired sessions', async () => {
    const onExpired = vi.fn()
    window.addEventListener('auth:expired', onExpired, { once: true })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
    await expect(request('/api/v1/me')).rejects.toBeInstanceOf(ApiError)
    expect(onExpired).toHaveBeenCalledOnce()
  })
  it('does not expose server exception details', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: 'private stack trace' }), { status: 500 }),
        ),
    )
    await expect(request('/api/v1/me')).rejects.toThrow('O serviço está indisponível.')
  })
})
