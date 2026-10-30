import { useId, useState } from 'react'
import { ChevronDown, Clock, Flame, Leaf, Sprout, Star } from 'lucide-react'
import CategoryIcon from '../components/CategoryIcon'
import { formatPrice } from '../lib/format'
import { STRINGS, pick } from '../lib/i18n'

const DIET_ICONS = { vegan: Sprout, vegetarian: Leaf, spicy: Flame }

export default function ProductItem({ product, category, lang, meta }) {
  const t = STRINGS[lang]
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const label = (list, code) => list?.find((x) => x.code === code)?.[lang] || code

  return (
    <li className={`dish${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="dish__main"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="dish__media" aria-hidden="true">
          {product.image ? (
            <img src={product.image} alt="" loading="lazy" />
          ) : (
            <CategoryIcon name={category.icon} className="dish__placeholder" />
          )}
        </span>
        <span className="dish__head">
          <span className="dish__name">{pick(product, 'name', lang)}</span>
          <span className="dish__leader" aria-hidden="true" />
          <span className="dish__price">{formatPrice(product.price, lang)}</span>
        </span>
        {pick(product, 'description', lang) && (
          <span className="dish__desc">{pick(product, 'description', lang)}</span>
        )}
        <span className="dish__tags">
          {product.is_popular && (
            <span className="dish-tag dish-tag--popular">
              <Star size={13} aria-hidden="true" />
              {t.popular}
            </span>
          )}
          {product.dietary.map((code) => {
            const Icon = DIET_ICONS[code]
            return (
              <span key={code} className={`dish-tag dish-tag--${code}`}>
                {Icon && <Icon size={13} aria-hidden="true" />}
                {label(meta?.dietary, code)}
              </span>
            )
          })}
          <ChevronDown size={16} className="dish__chevron" aria-hidden="true" />
        </span>
      </button>

      <div id={detailsId} className="dish__details" hidden={!open}>
        {product.ingredients?.length > 0 && (
          <p>
            <strong>{t.ingredients}:</strong> {product.ingredients.join(', ')}
          </p>
        )}
        <p>
          <strong>{t.allergens}:</strong>{' '}
          {product.allergens.length
            ? product.allergens.map((code) => label(meta?.allergens, code)).join(', ')
            : t.containsNone}
        </p>
        {product.preparation_time > 1 && (
          <p className="dish__prep">
            <Clock size={14} aria-hidden="true" /> {t.minutes(product.preparation_time)}
          </p>
        )}
      </div>
    </li>
  )
}
