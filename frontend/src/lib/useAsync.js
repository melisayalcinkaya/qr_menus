import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Basit veri yükleme kancası: { data, error, loading, reload, setData }
 *
 * `deps` değişince veri sıfırlanıp yeniden yüklenir; `reload()` ise eldeki veriyi
 * gösterirken arka planda yeniler (ekran boşalıp titremez).
 */
export function useAsync(loader, deps) {
  const key = JSON.stringify(deps)
  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState({ key: null, done: null, data: undefined, error: null })
  const loaderRef = useRef(loader)

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    let alive = true
    const done = `${key}#${nonce}`
    loaderRef.current().then(
      (data) => alive && setState({ key, done, data, error: null }),
      (error) => alive && setState((s) => ({ ...s, key, done, error })),
    )
    return () => {
      alive = false
    }
  }, [key, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback(
    (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })),
    [],
  )

  const sameKey = state.key === key
  return {
    data: sameKey ? state.data : undefined,
    error: sameKey ? state.error : null,
    loading: state.done !== `${key}#${nonce}`,
    reload,
    setData,
  }
}
