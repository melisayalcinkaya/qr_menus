// Tüm API çağrıları bu dosyadan geçer.
//
// Erişim belirteci yalnızca bu modülün belleğinde tutulur (localStorage'da değil);
// sayfa yenilenince HttpOnly çerezdeki yenileme belirteciyle yeniden alınır.

const BASE = '/api'

let accessToken = null
let refreshPromise = null
const sessionListeners = new Set()

export class ApiError extends Error {
  constructor(status, data) {
    super(messageFrom(status, data))
    this.status = status
    this.data = data
    this.fieldErrors = data && typeof data === 'object' && !data.detail ? data : {}
  }
}

function messageFrom(status, data) {
  if (status === 0) return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
  if (status === 429) return 'Çok fazla istek gönderildi. Biraz bekleyip tekrar deneyin.'
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') {
    const first = Object.values(data).flat()[0]
    if (typeof first === 'string') return first
  }
  if (status >= 500) return 'Sunucuda bir hata oluştu. Lütfen biraz sonra tekrar deneyin.'
  return 'İstek tamamlanamadı.'
}

export function setAccessToken(token) {
  accessToken = token
}

export function onSessionExpired(listener) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

/**
 * Yenileme çerezinden yeni erişim belirteci alır.
 * Aynı anda birden çok istek 401 alırsa tek bir yenileme isteği paylaşılır
 * (aksi halde rotasyon nedeniyle ikinci istek geçersiz belirteç kullanırdı).
 */
export function refreshAccess() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh/`, { method: 'POST', credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return false
        accessToken = (await res.json()).access
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function parseBody(res) {
  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) return res.json()
  return null
}

export async function api(path, { method = 'GET', body, auth = true, raw = false, retry = true } = {}) {
  const headers = {}
  let payload = body
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: payload, credentials: 'same-origin' })
  } catch {
    throw new ApiError(0, null)
  }

  if (res.status === 401 && auth && retry) {
    if (await refreshAccess()) return api(path, { method, body, auth, raw, retry: false })
    accessToken = null
    sessionListeners.forEach((fn) => fn())
  }
  if (!res.ok) throw new ApiError(res.status, await parseBody(res))
  if (raw) return res
  if (res.status === 204) return null
  return parseBody(res)
}

/** Sayfalı liste uç noktalarının tüm sayfalarını birleştirir. */
export async function apiList(path) {
  const results = []
  let next = path
  while (next) {
    const page = await api(next)
    results.push(...page.results)
    next = page.next ? page.next.slice(page.next.indexOf(BASE) + BASE.length) : null
  }
  return results
}

/** Kimlik doğrulamalı bir dosyayı (PNG/PDF) indirir. */
export async function downloadFile(path, filename) {
  const res = await api(path, { raw: true })
  const url = URL.createObjectURL(await res.blob())
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function fetchObjectUrl(path) {
  const res = await api(path, { raw: true })
  return URL.createObjectURL(await res.blob())
}
