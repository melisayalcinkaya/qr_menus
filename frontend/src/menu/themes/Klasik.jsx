/*
 * Klasik tema (1. şablon): sarı degrade başlık, turuncu yuvarlak arama simgesi,
 * iki sütunlu kategori kartları; altta turuncu "Menü" hapı ve gri ikon grubu.
 */
import { Link } from 'react-router-dom'
import { ArrowLeft, Globe, Hand, HandCoins, House, MessageSquareMore, Search, SlidersHorizontal, Wifi, X } from 'lucide-react'
import { useMenu } from '../MenuContext'
import { CallStatus, Media, Price, Tags } from '../shared'
import { useCurrentCategory, useLanguageToggle, useOpenProduct, useSearchResults } from '../hooks'
import './klasik.css'

function SearchBar() {
  const { query, setQuery, t, filterCount, openSheet } = useMenu()
  return (
    <div className="k-search m-search">
      <span className="k-search__icon" aria-hidden="true">
        <Search size={18} strokeWidth={2.5} />
      </span>
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
        <button type="button" className="k-icon-btn" onClick={() => setQuery('')} aria-label={t.close}>
          <X size={18} />
        </button>
      ) : (
        <button
          type="button"
          className="k-icon-btn"
          onClick={() => openSheet('filters')}
          aria-label={t.filtersTitle}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={18} />
          {filterCount > 0 && <span className="m-filter-badge">{filterCount}</span>}
        </button>
      )}
    </div>
  )
}

function Header({ title, back }) {
  const { data, t, link } = useMenu()
  const language = useLanguageToggle()
  return (
    <header className="k-hero">
      <div className="k-hero__top">
        {back ? (
          <Link to={link()} className="k-round" aria-label={t.back}>
            <ArrowLeft size={20} />
          </Link>
        ) : (
          data.logo && <img className="k-hero__logo" src={data.logo} alt="" />
        )}
        <div className="k-hero__title">
          <h1>{title}</h1>
          {data.table && <p>{t.table(data.table.label)}</p>}
        </div>
        <button type="button" className="k-round" {...language}>
          <Globe size={20} />
        </button>
      </div>
      <SearchBar />
    </header>
  )
}

function ProductGrid({ items }) {
  const openProduct = useOpenProduct()
  const { pick, t } = useMenu()
  return (
    <ul className="k-grid">
      {items.map(({ product, category }) => (
        <li key={product.id}>
          <button
            type="button"
            className="k-card k-card--product"
            onClick={() => openProduct(product, category)}
            aria-label={t.details(pick(product, 'name'))}
          >
            <Media src={product.image} icon={category.icon} className="k-card__media" />
            <span className="k-card__name">{pick(product, 'name')}</span>
            <span className="k-card__foot">
              <Price value={product.price} className="k-card__price" />
              <Tags product={product} limit={1} />
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

export function Home() {
  const { data, visible, link, pick, t } = useMenu()
  const results = useSearchResults()

  return (
    <div className="k-page m-page">
      <Header title={data.name} />
      <main className="k-body">
        {results ? (
          <>
            <h2 className="k-section-title">{t.searchResults(results.length)}</h2>
            {results.length ? <ProductGrid items={results} /> : <Empty />}
          </>
        ) : visible.length ? (
          <ul className="k-grid">
            {visible.map((c) => (
              <li key={c.id}>
                <Link to={link(`/k/${c.id}`)} className="k-card">
                  <Media src={c.image} icon={c.icon} className="k-card__media" />
                  <span className="k-card__name">{pick(c, 'name')}</span>
                  <span className="k-card__count">{t.productCount(c.products.length)}</span>
                </Link>
              </li>
            ))}
          </ul>
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
    <div className="k-page m-page">
      <Header title={pick(category, 'name')} back />
      <main className="k-body">
        {results && <h2 className="k-section-title">{t.searchResults(results.length)}</h2>}
        {items.length ? <ProductGrid items={items} /> : <Empty />}
      </main>
      <div className="m-dock-space" />
      <CallStatus />
      <Dock />
    </div>
  )
}

function Dock() {
  const { t, link, openSheet, data, call } = useMenu()
  const items = [
    { key: 'reviews', label: t.reviews, Icon: MessageSquareMore, onClick: () => openSheet('reviews') },
    {
      key: 'bill',
      label: t.requestBill,
      Icon: HandCoins,
      onClick: () => openSheet('call', { kind: 'bill' }),
      active: call.pending && call.current.kind === 'bill',
    },
    data.wifi && { key: 'wifi', label: t.wifi, Icon: Wifi, onClick: () => openSheet('wifi') },
    {
      key: 'waiter',
      label: t.callWaiter,
      Icon: Hand,
      onClick: () => openSheet('call', { kind: 'waiter' }),
      active: call.pending && call.current.kind === 'waiter',
    },
  ].filter(Boolean)
  return (
    <nav className="k-dock" aria-label={t.categories}>
      <div className="k-dock__inner">
        <Link to={link()} className="k-dock__home" onClick={() => window.scrollTo({ top: 0 })}>
          <House size={22} aria-hidden="true" />
          {t.home}
        </Link>
        <div className="k-dock__group">
          {items.map(({ key, label, Icon, onClick, active }) => (
            <button
              key={key}
              type="button"
              className={`k-dock__btn${active ? ' is-active' : ''}`}
              onClick={onClick}
              aria-label={label}
              title={label}
              aria-haspopup="dialog"
            >
              <Icon size={24} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
