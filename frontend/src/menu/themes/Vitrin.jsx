/*
 * Vitrin tema (3. şablon): sağ alt köşesi yuvarlatılmış siyah başlık, büyük slogan
 * ve pembe düğme; altta süzgeç + masa satırı, her kategori için yana kayan bej
 * ürün kartları (görsel kartın üstüne taşar) ve siyah alt bant.
 *
 * Şablondan uyarlananlar: sepet simgesi yerine dil düğmesi, "sepete ekle" yerine
 * ürün ayrıntısı, adres çubuğu yerine masa bilgisi ve garson/hesap çağrısı.
 */
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Globe,
  Hand,
  House,
  Info,
  MapPin,
  Menu as MenuIcon,
  MessageSquareMore,
  Search,
  SlidersHorizontal,
  Wifi,
  X,
} from 'lucide-react'
import { useMenu } from '../MenuContext'
import { CallStatus, Media, Price } from '../shared'
import { useCurrentCategory, useLanguageToggle, useOpenProduct, useSearchResults } from '../hooks'
import './vitrin.css'

function TopBar({ back }) {
  const { data, t, link, openSheet } = useMenu()
  const language = useLanguageToggle()
  return (
    <div className="v-top">
      {back ? (
        <Link to={link()} className="v-top__btn" aria-label={t.back}>
          <ArrowLeft size={28} />
        </Link>
      ) : (
        <button type="button" className="v-top__btn" onClick={() => openSheet('categories')} aria-label={t.allCategories} aria-haspopup="dialog">
          <MenuIcon size={32} strokeWidth={2.2} />
        </button>
      )}
      <p className="v-top__name">{data.name}</p>
      <button type="button" className="v-top__btn" {...language}>
        <Globe size={28} />
      </button>
    </div>
  )
}

function Hero() {
  const { data, pick, t, visible } = useMenu()
  const tagline = pick(data, 'tagline') || data.name
  const hasFavourites = visible.some((c) => c.products.some((p) => p.is_popular))
  return (
    <header className="v-hero">
      <TopBar />
      <h1 className="v-hero__title">{tagline}</h1>
      {pick(data, 'about') && <p className="v-hero__about">{pick(data, 'about')}</p>}
      {hasFavourites && (
        <a className="v-hero__cta" href="#sevilenler">
          {t.seeFavourites}
        </a>
      )}
    </header>
  )
}

/** Şablondaki süzgeç + konum satırı: konum yerine masa, açılır ok garson/hesap panelini açar. */
function ToolsRow() {
  const { t, data, openSheet, filterCount, query, setQuery } = useMenu()
  return (
    <div className="v-tools">
      <button type="button" className="v-tools__icon" onClick={() => openSheet('filters')} aria-label={t.filtersTitle} aria-haspopup="dialog">
        <SlidersHorizontal size={26} />
        {filterCount > 0 && <span className="m-filter-badge">{filterCount}</span>}
      </button>
      <MapPin size={30} aria-hidden="true" className="v-tools__pin" />
      <button type="button" className="v-tools__pill" onClick={() => openSheet('call', { kind: 'waiter' })} aria-haspopup="dialog">
        <span>{data.table ? `${t.table(data.table.label)} · ${t.callWaiter}` : t.callWaiter}</span>
        <ChevronDown size={20} aria-hidden="true" />
      </button>
      <div className="v-search m-search">
        <Search size={18} aria-hidden="true" />
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
        {query && (
          <button type="button" className="v-search__clear" onClick={() => setQuery('')} aria-label={t.close}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, category }) {
  const openProduct = useOpenProduct()
  const { pick, t } = useMenu()
  return (
    <button type="button" className="v-card" onClick={() => openProduct(product, category)} aria-label={t.details(pick(product, 'name'))}>
      <Media src={product.image} icon={category.icon} className="v-card__media" />
      <span className="v-card__head">
        <span className="v-card__name">{pick(product, 'name')}</span>
        <span className="v-card__info" aria-hidden="true">
          <Info size={16} />
        </span>
      </span>
      <span className="v-card__desc">{pick(product, 'description')}</span>
      <Price value={product.price} className="v-card__price" />
    </button>
  )
}

function Shelf({ id, title, items, more }) {
  const { t } = useMenu()
  return (
    <section className="v-shelf" id={id} aria-labelledby={`${id}-title`}>
      <div className="v-shelf__head">
        <h2 id={`${id}-title`}>{title}</h2>
        {more && (
          <Link to={more} className="v-shelf__more">
            {t.seeAll} <ChevronRight size={16} aria-hidden="true" />
          </Link>
        )}
      </div>
      <ul className="v-shelf__track">
        {items.map(({ product, category }) => (
          <li key={product.id}>
            <ProductCard product={product} category={category} />
          </li>
        ))}
      </ul>
    </section>
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

function Grid({ items }) {
  return (
    <ul className="v-grid">
      {items.map(({ product, category }) => (
        <li key={product.id}>
          <ProductCard product={product} category={category} />
        </li>
      ))}
    </ul>
  )
}

export function Home() {
  const { visible, link, pick, t } = useMenu()
  const results = useSearchResults()
  const favourites = visible.flatMap((c) => c.products.filter((p) => p.is_popular).map((p) => ({ product: p, category: c })))

  return (
    <div className="v-page m-page">
      <Hero />
      <ToolsRow />
      <main className="v-body">
        {results ? (
          <>
            <h2 className="v-results">{t.searchResults(results.length)}</h2>
            {results.length ? <Grid items={results} /> : <Empty />}
          </>
        ) : visible.length ? (
          <>
            {favourites.length > 0 && <Shelf id="sevilenler" title={t.favourites} items={favourites} />}
            {visible.map((c) => (
              <Shelf
                key={c.id}
                id={`kategori-${c.id}`}
                title={pick(c, 'name')}
                items={c.products.map((p) => ({ product: p, category: c }))}
                more={link(`/k/${c.id}`)}
              />
            ))}
          </>
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
    <div className="v-page m-page">
      <header className="v-hero v-hero--compact">
        <TopBar back />
        <h1 className="v-hero__title">{pick(category, 'name')}</h1>
      </header>
      <ToolsRow />
      <main className="v-body">
        {results && <h2 className="v-results">{t.searchResults(results.length)}</h2>}
        {items.length ? <Grid items={items} /> : <Empty />}
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
      key: 'call',
      label: `${t.callWaiter} / ${t.requestBill}`,
      short: t.callWaiter,
      Icon: Hand,
      onClick: () => openSheet('call', { kind: 'waiter' }),
      active: call.pending,
    },
    data.wifi && { key: 'wifi', label: t.wifi, Icon: Wifi, onClick: () => openSheet('wifi') },
  ].filter(Boolean)
  return (
    <nav className="v-dock" aria-label={t.categories}>
      <div className="v-dock__inner">
        <Link to={link()} className="v-dock__btn" onClick={() => window.scrollTo({ top: 0 })}>
          <House size={22} aria-hidden="true" />
          <span>{t.home}</span>
        </Link>
        {items.map(({ key, label, short, Icon, onClick, active }) => (
          <button
            key={key}
            type="button"
            className={`v-dock__btn${active ? ' is-active' : ''}`}
            onClick={onClick}
            aria-label={label}
            aria-haspopup="dialog"
          >
            <Icon size={22} aria-hidden="true" />
            <span aria-hidden="true">{short || label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
