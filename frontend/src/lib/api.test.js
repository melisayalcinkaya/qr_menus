import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, refreshAccess, setAccessToken } from './api'

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => {
  vi.restoreAllMocks()
  setAccessToken(null)
})

describe('api client', () => {
  it('shares a single refresh request between concurrent callers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json(200, { access: 'new' }))
    const results = await Promise.all([refreshAccess(), refreshAccess(), refreshAccess()])
    expect(results).toEqual([true, true, true])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refreshes once on 401 and retries with the new token', async () => {
    setAccessToken('old')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts) => {
      if (url.endsWith('/auth/refresh/')) return json(200, { access: 'fresh' })
      return opts.headers.Authorization === 'Bearer fresh' ? json(200, { ok: true }) : json(401, { detail: 'expired' })
    })
    await expect(api('/businesses/')).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('turns DRF field errors into readable messages', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json(400, { price: ['Geçerli bir sayı girin.'] }))
    const err = await api('/products/', { method: 'POST', body: {} }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('Geçerli bir sayı girin.')
    expect(err.fieldErrors.price).toEqual(['Geçerli bir sayı girin.'])
  })

  it('reports network failures in plain language', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    const err = await api('/meta/', { auth: false }).catch((e) => e)
    expect(err.status).toBe(0)
    expect(err.message).toMatch(/Sunucuya ulaşılamadı/)
  })
})
