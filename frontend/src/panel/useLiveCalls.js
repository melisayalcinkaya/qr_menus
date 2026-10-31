import { useCallback, useEffect, useRef, useState } from 'react'
import { api, apiList } from '../lib/api'

const POLL_MS = 5000

/**
 * Bekleyen garson çağrılarını düzenli aralıklarla çeker.
 *
 * Neden WebSocket değil? Ücretsiz barındırmada tek süreçli, uyuyabilen bir sunucu
 * var; 5 saniyelik yoklama (polling) burada daha basit ve dayanıklı. Sekme arka
 * plandayken yoklama durur, öne gelince hemen yenilenir.
 */
export function useLiveCalls(slug) {
  const [calls, setCalls] = useState([])
  const [error, setError] = useState(null)
  const [newIds, setNewIds] = useState([])
  const known = useRef(null)

  const load = useCallback(async () => {
    try {
      const list = await apiList(`/waiter-calls/?business=${slug}&status=pending`)
      // Anahtar = id + tür: garson çağrısı hesaba yükseltilirse (aynı id) yeni sayılır
      const keys = list.map((c) => `${c.id}:${c.kind}`)
      if (known.current) {
        const fresh = list.filter((c, i) => !known.current.has(keys[i])).map((c) => c.id)
        if (fresh.length) setNewIds(fresh)
      }
      known.current = new Set(keys)
      setCalls(list)
      setError(null)
    } catch (err) {
      setError(err)
    }
  }, [slug])

  useEffect(() => {
    known.current = null
    load()
    let id = setInterval(load, POLL_MS)
    const onVisibility = () => {
      clearInterval(id)
      if (document.visibilityState === 'visible') {
        load()
        id = setInterval(load, POLL_MS)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  const close = useCallback(
    async (call, action) => {
      // İyimser güncelleme: kart hemen kaybolur, hata olursa geri gelir
      setCalls((list) => list.filter((c) => c.id !== call.id))
      try {
        await api(`/waiter-calls/${call.id}/${action}/`, { method: 'POST' })
      } catch (err) {
        if (err.status !== 409) setCalls((list) => [call, ...list])
        throw err
      }
    },
    [],
  )

  return { calls, error, newIds, reload: load, close }
}

let audioContext = null

/** Yeni çağrıda iki tonlu kısa bir zil sesi (ses dosyası gerektirmez). */
export function playChime() {
  try {
    audioContext ??= new AudioContext()
    const now = audioContext.currentTime
    ;[880, 1175].forEach((freq, i) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.0001, now + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.5)
      osc.connect(gain).connect(audioContext.destination)
      osc.start(now + i * 0.18)
      osc.stop(now + i * 0.18 + 0.55)
    })
  } catch {
    /* ses desteklenmiyorsa sessizce geç */
  }
}

export function unlockAudio() {
  try {
    audioContext ??= new AudioContext()
    audioContext.resume()
  } catch {
    /* yok say */
  }
}
