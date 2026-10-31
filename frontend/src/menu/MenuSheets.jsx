import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, Clock, HandCoins } from 'lucide-react'
import Sheet from '../components/Sheet'
import { useMenu } from './MenuContext'
import FilterSheet from './FilterSheet'
import WifiSheet from './WifiSheet'
import ReviewsSheet from './ReviewsSheet'
import { Media, Price, Tags } from './shared'
import { countProducts, filterMenu } from '../lib/menuFilter'

/** Tüm temaların ortak panelleri. Hangisinin açık olduğunu MenuContext tutar. */
export default function MenuSheets() {
  const ctx = useMenu()
  const { sheet, closeSheet, t, lang, data, slug, meta, filters, setFilters, query } = ctx
  const name = sheet?.name

  return (
    <>
      <FilterSheet
        open={name === 'filters'}
        onClose={closeSheet}
        t={t}
        lang={lang}
        meta={meta}
        filters={filters}
        onChange={setFilters}
        resultCount={(f) => countProducts(filterMenu(data.categories, { query, ...f }))}
      />
      {data.wifi && <WifiSheet open={name === 'wifi'} onClose={closeSheet} wifi={data.wifi} t={t} />}
      <ReviewsSheet open={name === 'reviews'} onClose={closeSheet} slug={slug} t={t} lang={lang} />
      <CallSheet open={name === 'call'} initialKind={sheet?.kind} />
      <ProductSheet open={name === 'product'} product={sheet?.product} category={sheet?.category} />
      <CategoriesSheet open={name === 'categories'} />
    </>
  )
}

function ProductSheet({ open, product, category }) {
  const { closeSheet, t, meta, lang, pick } = useMenu()
  if (!product) return <Sheet open={false} onClose={closeSheet} title="" />
  const label = (code) => meta?.allergens.find((a) => a.code === code)?.[lang] || code
  return (
    <Sheet open={open} onClose={closeSheet} title={pick(product, 'name')} closeLabel={t.close} className="sheet--product">
      <Media src={product.image} icon={category?.icon} className="product-sheet__media" />
      <div className="product-sheet__head">
        <Tags product={product} limit={4} />
        <Price value={product.price} className="product-sheet__price" />
      </div>
      {pick(product, 'description') && <p className="sheet__text">{pick(product, 'description')}</p>}
      <dl className="product-sheet__facts">
        {product.ingredients?.length > 0 && (
          <div>
            <dt>{t.ingredients}</dt>
            <dd>{product.ingredients.join(', ')}</dd>
          </div>
        )}
        <div>
          <dt>{t.allergens}</dt>
          <dd>{product.allergens.length ? product.allergens.map(label).join(', ') : t.containsNone}</dd>
        </div>
        {product.preparation_time > 1 && (
          <div>
            <dt>
              <Clock size={14} aria-hidden="true" /> {t.minutes(product.preparation_time)}
            </dt>
          </div>
        )}
      </dl>
    </Sheet>
  )
}

function CallSheet({ open, initialKind }) {
  const { closeSheet, t, data, call } = useMenu()
  const [kind, setKind] = useState(initialKind || 'waiter')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [lastKind, setLastKind] = useState(initialKind)
  // Panel her açılışta, açan düğmenin türüyle başlasın
  if (open && initialKind !== lastKind) {
    setLastKind(initialKind)
    setKind(initialKind || 'waiter')
  }

  if (!data.table) {
    return (
      <Sheet open={open} onClose={closeSheet} title={t.callWaiter} closeLabel={t.close}>
        <p className="sheet__text">{t.scanTableQr}</p>
      </Sheet>
    )
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await call.send(kind, new FormData(e.currentTarget).get('note'))
      closeSheet()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const options = [
    { value: 'waiter', title: t.callWaiter, hint: t.callWaiterHint, Icon: BellRing },
    { value: 'bill', title: t.requestBill, hint: t.requestBillHint, Icon: HandCoins },
  ]

  return (
    <Sheet open={open} onClose={closeSheet} title={t.callTitle} closeLabel={t.close} className="sheet--call">
      <p className="sheet__text sheet__muted">{t.table(data.table.label)}</p>
      <form className="call-form" onSubmit={submit}>
        <fieldset className="call-options">
          <legend className="visually-hidden">{t.callTitle}</legend>
          {options.map(({ value, title, hint, Icon }) => (
            <label key={value} className="call-option">
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} />
              <Icon size={26} aria-hidden="true" />
              <span className="call-option__title">{title}</span>
              <span className="call-option__hint">{hint}</span>
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>{t.callNote}</span>
          <input name="note" maxLength={200} placeholder={t.callNotePlaceholder} />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="sheet-button" disabled={busy}>
          {kind === 'bill' ? t.requestBill : t.callWaiter}
        </button>
      </form>
    </Sheet>
  )
}

function CategoriesSheet({ open }) {
  const { closeSheet, t, data, link, pick } = useMenu()
  return (
    <Sheet open={open} onClose={closeSheet} title={t.categories} closeLabel={t.close}>
      <ul className="category-sheet">
        {data.categories.map((c) => (
          <li key={c.id}>
            <Link to={link(`/k/${c.id}`)} onClick={closeSheet}>
              <Media src={c.image} icon={c.icon} className="category-sheet__media" />
              <span>{pick(c, 'name')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
