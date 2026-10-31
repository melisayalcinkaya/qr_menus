import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { loadMeta } from '../lib/meta'
import { useAsync } from '../lib/useAsync'
import { STRINGS, initialLang, pick, saveLang } from '../lib/i18n'
import { filterMenu } from '../lib/menuFilter'

export const THEMES = ['klasik', 'bistro', 'vitrin']
const POLL_MS = 8000
const RECENT_MS = 15 * 60 * 1000

const MenuContext = createContext(null)

export function useMenu() {
  return useContext(MenuContext)
}

/**
 * Müşteri menüsünün tüm durumu: veri, dil, arama ve süzgeç, açık panel ve masa
 * çağrısı. Temalar yalnızca bu değerleri çizer; böylece üç tasarım aynı davranışı paylaşır.
 */
export function MenuProvider({ children }) {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const tableToken = params.get('masa') || ''
  const preview = params.get('preview') === '1'
  const themeOverride = THEMES.includes(params.get('tema')) ? params.get('tema') : null

  const menu = useAsync(() => {
    const qs = new URLSearchParams()
    if (tableToken) qs.set('masa', tableToken)
    if (preview) qs.set('preview', '1')
    return api(`/public/${slug}/?${qs}`, { auth: false })
  }, [slug, tableToken, preview])
  const meta = useAsync(loadMeta, [])

  const [lang, setLangState] = useState(initialLang)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ excludeAllergens: [], dietary: [] })
  const [sheet, setSheet] = useState(null) // { name, ...props }

  const data = menu.data
  const t = STRINGS[lang]
  const theme = themeOverride || data?.theme || 'klasik'

  const setLang = useCallback((next) => {
    setLangState(next)
    saveLang(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    if (data) document.title = data.name
  }, [lang, data])

  const visible = useMemo(() => (data ? filterMenu(data.categories, { query, ...filters }) : []), [data, query, filters])
  const filterCount = filters.excludeAllergens.length + filters.dietary.length

  // Masa içindeki gezintide ?masa=... ve önizleme parametreleri korunur
  const search = location.search
  const link = useCallback((path = '') => `/m/${slug}${path}${search}`, [slug, search])

  const call = useTableCall(slug, data?.table)

  const value = {
    slug,
    menu,
    data,
    meta: meta.data,
    lang,
    setLang,
    t,
    theme,
    query,
    setQuery,
    filters,
    setFilters,
    filterCount,
    visible,
    sheet,
    openSheet: (name, props = {}) => setSheet({ name, ...props }),
    closeSheet: () => setSheet(null),
    link,
    pick: (obj, field) => pick(obj, field, lang),
    call,
  }
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

// Eski bir çağrı "tamamlandı" diye gösterilmesin; yalnızca yakın zamanda kapananlar
function withRecency(call) {
  const recent = call.completed_at && Date.now() - new Date(call.completed_at).getTime() < RECENT_MS
  return { ...call, recent }
}

/** Masanın son çağrısını izler; çağrı bekliyorsa düzenli aralıkla durumunu yeniler. */
function useTableCall(slug, table) {
  const [current, setCurrent] = useState(null)
  const token = table?.token
  const statusUrl = token ? `/public/${slug}/tables/${token}/call/` : null

  const refresh = useCallback(() => {
    if (!statusUrl) return Promise.resolve()
    return api(statusUrl, { auth: false })
      .then((c) => setCurrent(withRecency(c)))
      .catch((err) => err.status === 404 && setCurrent(null))
  }, [statusUrl])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (current?.status !== 'pending') return
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [current?.status, refresh])

  const send = useCallback(
    async (kind, note) => {
      const created = await api(`/public/${slug}/waiter-calls/`, {
        method: 'POST',
        auth: false,
        body: { table: token, kind, note },
      })
      setCurrent(withRecency(created))
      return created
    },
    [slug, token],
  )

  return {
    available: Boolean(token),
    current,
    pending: current?.status === 'pending',
    send,
  }
}
