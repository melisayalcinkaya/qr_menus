import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, onSessionExpired, refreshAccess, setAccessToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined: henüz kontrol edilmedi, null: oturum yok
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    let alive = true
    // Sayfa yenilendiğinde oturumu HttpOnly çerezden geri yükle
    refreshAccess()
      .then((ok) => (ok ? api('/auth/me/') : null))
      .catch(() => null)
      .then((me) => alive && setUser(me))
    const off = onSessionExpired(() => setUser(null))
    return () => {
      alive = false
      off()
    }
  }, [])

  const handleTokens = useCallback((data) => {
    setAccessToken(data.access)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      login: (username, password) =>
        api('/auth/login/', { method: 'POST', body: { username, password }, auth: false }).then(handleTokens),
      register: (form) => api('/auth/register/', { method: 'POST', body: form, auth: false }).then(handleTokens),
      logout: async () => {
        await api('/auth/logout/', { method: 'POST', auth: false }).catch(() => {})
        setAccessToken(null)
        setUser(null)
      },
    }),
    [user, handleTokens],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
