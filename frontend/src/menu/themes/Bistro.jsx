/*
 * Bistro tema (2. şablon): açık gri zemin, kırmızı vurgulu arama, yatay kategori
 * kartları (dörtlü sayfalar, nokta göstergesi, "Tümünü gör") ve ortasında beyaz ev
 * düğmesi olan kırmızı alt çubuk.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Globe, Hand, House, MessageSquareMore, Search, SlidersHorizontal, Wifi, X } from 'lucide-react'
import { useMenu } from '../MenuContext'
import { CallStatus, Media, Price, Tags } from '../shared'
import { useCurrentCategory, useLanguageToggle, useOpenProduct, useSearchResults } from '../hooks'
import './bistro.css'

const PAGE_SIZE = 4

function SearchRow() {
  const { query, setQuery, t, filterCount, openSheet } = useMenu()
  return (
    <div className="b-search-row">
      <div className="b-search m-search">
        <label className="visually-hidden" htmlFor="menu-search">
          {t.search}
        </label>
        <input
          id="menu-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          enterKeyHint="search"
        />
        {query ? (
          <button type="button" className="b-search__btn" onClick={() => setQuery('')} aria-label={t.close}>
            <X size={20} />
          </button>
        ) : (
          <Search size={20} strokeWidth={2.5} aria-hidden="true" className="b-search__btn" />
        )}
      </div>
      <button
        type="button"
        className="b-filter"
        onClick={() => openSheet('filters')}
        aria-label={t.filtersTitle}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal size={18} />
        {filterCount > 0 && <span className="m-filter-badge">{filterCount}</span>}
      </button>
    </div>
  )
}

function Header({ title, back }) {
  const { data, t, link } = useMenu()
  return (
    <header className="b-header">
      <div className="b-header__row">
        {back && (
          <Link to={link()} className="b-back" aria-label={t.back}>
            <ArrowLeft size={20} />
          </Link>
        )}
        <div>
          <h1>{title}</h1>
          <p>{back ? data.name : data.table ? t.table(data.table.label) : ''}</p>
        </div>
      </div>
      <SearchRow />
    </header>
  )
}

function ProductList({ items }) {
  const openProduct = useOpenProduct()
  const { pick, t } = useMenu()
  return (
    <ul className="b-list">
      {items.map(({ product, category }) => (
        <li key={product.id}>
          <button
            type="button"
            className="b-row b-row--product"
            onClick={() => openProduct(product, category)}
            aria-label={t.details(pick(product, 'name'))}
          >
            <Media src={product.image} icon={category.icon} className="b-row__media" />
            <span className="b-row__body">
              <span className="b-row__name">{pick(product, 'name')}</span>
              {pick(product, 'description') && <span className="b-row__desc">{pick(product, 'description')}</span>}
              <span className="b-row__foot">
                <Price value={product.price} className="b-row__price" />
                <Tags product={product} limit={2} />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Empty() {
  const { t, setQuery, setFilters } = useMenu()
  return (
    <div className="m-empty" role="status">
      <p>{t.noResults}</p>
      <p>{t.noResultsHint}</p>
      <button
        type="button"
        className="sheet-button"
        onClick={() => {
          setQuery('')
          setFilters({ excludeAllergens: [], dietary: [] })
        }}
      >
        {t.clearFilters}
      </button>
    </div>
  )
}

/** Kategori kartları dörtlü sayfalar halinde yana kayar; noktalar hangi sayfada olunduğunu gösterir. */
function CategoryPager({ categories }) {
  const { link, pick, t } = useMenu()
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(0)
  const track = useRef(null)
  const pages = []
  for (let i = 0; i < categories.length; i += PAGE_SIZE) pages.push(categories.slice(i, i + PAGE_SIZE))

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => setPage(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [expanded])

  const card = (c) => (
    <li key={c.id}>
      <Link to={link(`/k/${c.id}`)} className="b-row">
        <Media src={c.image} icon={c.icon} className="b-row__media" />
        <span className="b-row__title">{pick(c, 'name')}</span>
      </Link>
    </li>
  )

  return (
    <section aria-label={t.categories}>
      {expanded || pages.length === 1 ? (
        <ul className="b-list">{categories.map(card)}</ul>
      ) : (
        <div className="b-pager" ref={track}>
          {pages.map((items, i) => (
            <ul key={i} className="b-list b-pager__page" aria-label={t.page(i + 1)}>
              {items.map(card)}
            </ul>
          ))}
        </div>
      )}
      <div className="b-pager__foot">
        {!expanded && pages.length > 1 ? (
          <div className="b-dots" aria-hidden="true">
            {pages.map((_, i) => (
              <span key={i} className={i === page ? 'is-active' : ''} />
            ))}
          </div>
        ) : (
          <span />
        )}
        {pages.length > 1 && (
          <button type="button" className="b-more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? t.seeLess : t.seeAll}
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  )
}

export function Home() {
  const { data, visible, t } = useMenu()
  const results = useSearchResults()
  return (
    <div className="b-page m-page">
      <Header title={data.name} />
      <main className="b-body">
        {results ? (
          <>
            <h2 className="b-section-title">{t.searchResults(results.length)}</h2>
            {results.length ? <ProductList items={results} /> : <Empty />}
          </>
        ) : visible.length ? (
          <CategoryPager categories={visible} />
        ) : (
          <Empty />
        )}
        <p className="m-note">{t.priceNote}</p>
      </main>
      <div className="m-dock-space" />
      <CallStatus />
      <Dock />
    </div>
  )
}

export function CategoryPage() {
  const { category, products } = useCurrentCategory()
  const { pick, t } = useMenu()
  const results = useSearchResults()
  if (!category) return <Home />
  const items = results || products.map((p) => ({ product: p, category }))
  return (
    <div className="b-page m-page">
      <Header title={pick(category, 'name')} back />
      <main className="b-body">
        {results && <h2 className="b-section-title">{t.searchResults(results.length)}</h2>}
        {items.length ? <ProductList items={items} /> : <Empty />}
      </main>
      <div className="m-dock-space" />
      <CallStatus />
      <Dock />
    </div>
  )
}

function Dock() {
  const { t, link, openSheet, data, call } = useMenu()
  const language = useLanguageToggle()
  return (
    <nav className="b-dock" aria-label={t.categories}>
      <div className="b-dock__bar">
        <div className="b-dock__side">
          <button type="button" className="b-dock__btn" onClick={() => openSheet('reviews')} aria-label={t.reviews} title={t.reviews} aria-haspopup="dialog">
            <MessageSquareMore size={24} aria-hidden="true" />
          </button>
          <span className="b-dock__divider" aria-hidden="true" />
          <button
            type="button"
            className={`b-dock__btn${call.pending ? ' is-active' : ''}`}
            onClick={() => openSheet('call', { kind: 'waiter' })}
            aria-label={t.callOrBill}
            title={t.callOrBill}
            aria-haspopup="dialog"
          >
            <Hand size={24} aria-hidden="true" />
          </button>
        </div>
        <Link to={link()} className="b-dock__home" aria-label={t.home} onClick={() => window.scrollTo({ top: 0 })}>
          <House size={26} aria-hidden="true" />
        </Link>
        <div className="b-dock__side">
          {data.wifi ? (
            <button type="button" className="b-dock__btn" onClick={() => openSheet('wifi')} aria-label={t.wifi} title={t.wifi} aria-haspopup="dialog">
              <Wifi size={24} aria-hidden="true" />
            </button>
          ) : (
            <span className="b-dock__btn" />
          )}
          <span className="b-dock__divider" aria-hidden="true" />
          <button type="button" className="b-dock__btn" {...language}>
            <Globe size={24} aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  )
}
