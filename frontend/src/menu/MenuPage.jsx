import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { BellRing, MessageSquare, Search, SlidersHorizontal, Wifi, X } from 'lucide-react'
import { api } from '../lib/api'
import { loadMeta } from '../lib/meta'
import { useAsync } from '../lib/useAsync'
import { STRINGS, initialLang, pick, saveLang } from '../lib/i18n'
import { countProducts, filterMenu } from '../lib/menuFilter'
import CategoryIcon from '../components/CategoryIcon'
import Sheet from '../components/Sheet'
import ProductItem from './ProductItem'
import FilterSheet from './FilterSheet'
import WifiSheet from './WifiSheet'
import ReviewsSheet from './ReviewsSheet'
import WaiterCall from './WaiterCall'
import './menu.css'
import './themes.css'

const THEMES = ['klasik', 'bistro', 'vitrin']

export default function MenuPage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
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

  const [lang, setLang] = useState(initialLang)
  const t = STRINGS[lang]
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ excludeAllergens: [], dietary: [] })
  const [sheet, setSheet] = useState(null)

  const data = menu.data
  const theme = themeOverride || data?.theme || 'klasik'

  useEffect(() => {
    if (data) document.title = data.name
    document.documentElement.lang = lang
  }, [data, lang])

  const visible = useMemo(
    () => (data ? filterMenu(data.categories, { query, ...filters }) : []),
    [data, query, filters],
  )
  const activeCategory = useScrollSpy(visible.map((c) => `cat-${c.id}`))
  const filterCount = filters.excludeAllergens.length + filters.dietary.length

  function toggleLang() {
    const next = lang === 'tr' ? 'en' : 'tr'
    setLang(next)
    saveLang(next)
  }

  if (menu.loading && !data) {
    return (
      <div className={`menu theme-${theme} menu--state`} aria-busy="true">
        <p className="menu-state">{t.loading}…</p>
      </div>
    )
  }
  if (menu.error) {
    const missing = menu.error.status === 404
    return (
      <div className={`menu theme-${theme} menu--state`}>
        <div className="menu-state" role="alert">
          <p>{missing ? t.notFound : menu.error.message}</p>
          {!missing && (
            <button type="button" className="menu-button" onClick={menu.reload}>
              {t.retry}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`menu theme-${theme}`}>
      <header className="menu-head">
        <div className="menu-head__brand">
          {data.logo && <img className="menu-head__logo" src={data.logo} alt="" />}
          <div>
            <h1 className="menu-head__name">{data.name}</h1>
            {data.table && <p className="menu-head__table">{t.table(data.table.label)}</p>}
          </div>
        </div>
        <button type="button" className="menu-chip menu-head__lang" onClick={toggleLang} lang={lang === 'tr' ? 'en' : 'tr'}>
          {t.language}
        </button>
      </header>

      <nav className="cat-nav" aria-label={t.categories}>
        <ul>
          {visible.map((c) => (
            <li key={c.id}>
              <a
                href={`#cat-${c.id}`}
                className="cat-nav__link"
                aria-current={activeCategory === `cat-${c.id}` ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: smoothScroll() })
                }}
              >
                <CategoryIcon name={c.icon} size={16} />
                {pick(c, 'name', lang)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="menu-tools">
        <label className="menu-search">
          <Search size={18} aria-hidden="true" />
          <span className="visually-hidden">{t.search}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="icon-button" onClick={() => setQuery('')} aria-label={t.close}>
              <X size={16} />
            </button>
          )}
        </label>
        <button
          type="button"
          className="menu-chip menu-tools__filter"
          onClick={() => setSheet('filters')}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {t.filters}
          {filterCount > 0 && <span className="menu-badge">{filterCount}</span>}
        </button>
      </div>

      <main className="menu-body" id="menu">
        {visible.length === 0 ? (
          <div className="menu-empty" role="status">
            <p>{t.noResults}</p>
            <p className="menu-empty__hint">{t.noResultsHint}</p>
            <button
              type="button"
              className="menu-button"
              onClick={() => {
                setQuery('')
                setFilters({ excludeAllergens: [], dietary: [] })
              }}
            >
              {t.clearFilters}
            </button>
          </div>
        ) : (
          visible.map((c) => (
            <section key={c.id} id={`cat-${c.id}`} className="menu-section" aria-labelledby={`cat-title-${c.id}`}>
              <h2 id={`cat-title-${c.id}`} className="menu-section__title">
                <CategoryIcon name={c.icon} className="menu-section__icon" />
                {pick(c, 'name', lang)}
              </h2>
              <ul className="dish-list">
                {c.products.map((p) => (
                  <ProductItem key={p.id} product={p} category={c} lang={lang} meta={meta.data} />
                ))}
              </ul>
            </section>
          ))
        )}
        <p className="menu-note">{t.priceNote}</p>
      </main>

      <footer className="menu-dock">
        <div className="menu-dock__inner">
          {data.wifi && (
            <button type="button" className="dock-button" onClick={() => setSheet('wifi')} aria-haspopup="dialog">
              <Wifi size={20} aria-hidden="true" />
              <span>{t.wifi}</span>
            </button>
          )}
          <button type="button" className="dock-button" onClick={() => setSheet('reviews')} aria-haspopup="dialog">
            <MessageSquare size={20} aria-hidden="true" />
            <span>{t.reviews}</span>
          </button>
          {data.table ? (
            <WaiterCall slug={slug} table={data.table} t={t} />
          ) : (
            <button type="button" className="dock-button" onClick={() => setSheet('no-table')} aria-haspopup="dialog">
              <BellRing size={20} aria-hidden="true" />
              <span>{t.callWaiter}</span>
            </button>
          )}
        </div>
      </footer>

      <FilterSheet
        open={sheet === 'filters'}
        onClose={() => setSheet(null)}
        t={t}
        lang={lang}
        meta={meta.data}
        filters={filters}
        onChange={setFilters}
        resultCount={(f) => countProducts(filterMenu(data.categories, { query, ...f }))}
      />
      {data.wifi && <WifiSheet open={sheet === 'wifi'} onClose={() => setSheet(null)} wifi={data.wifi} t={t} />}
      <ReviewsSheet open={sheet === 'reviews'} onClose={() => setSheet(null)} slug={slug} t={t} lang={lang} />
      <NoTableSheet open={sheet === 'no-table'} onClose={() => setSheet(null)} t={t} />
    </div>
  )
}

function NoTableSheet({ open, onClose, t }) {
  return (
    <Sheet open={open} onClose={onClose} title={t.callWaiter} closeLabel={t.close}>
      <p className="sheet__text">{t.scanTableQr}</p>
    </Sheet>
  )
}

function smoothScroll() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

/** Ekranda görünen kategori bölümünü izler (kategori çubuğunda vurgulamak için). */
function useScrollSpy(ids) {
  const [active, setActive] = useState(null)
  const key = ids.join(',')
  const visibleRef = useRef(new Map())

  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver === 'undefined') return
    const seen = visibleRef.current
    seen.clear()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null))
        const current = [...seen.entries()].filter(([, top]) => top !== null).sort((a, b) => a[1] - b[1])[0]
        if (current) setActive(current[0])
      },
      { rootMargin: '-120px 0px -55% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Aktif sekme yatay kategori çubuğunda görünür kalsın
  useEffect(() => {
    if (!active) return
    const link = document.querySelector(`.cat-nav a[href="#${active}"]`)
    link?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' })
  }, [active])

  return active
}
