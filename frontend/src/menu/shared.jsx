// Temaların ortak kullandığı küçük bileşenler
import { Flame, Leaf, Sprout, Star } from 'lucide-react'
import CategoryIcon from '../components/CategoryIcon'
import { formatPrice } from '../lib/format'
import { useMenu } from './MenuContext'

const DIET_ICONS = { vegan: Sprout, vegetarian: Leaf, spicy: Flame }

/** Görsel varsa fotoğraf, yoksa kategori ikonu. */
export function Media({ src, icon, className = '' }) {
  return (
    <span className={`media ${className}`} aria-hidden="true">
      {src ? <img src={src} alt="" loading="lazy" /> : <CategoryIcon name={icon} className="media__icon" />}
    </span>
  )
}

export function Price({ value, className = 'price' }) {
  const { lang } = useMenu()
  return <span className={className}>{formatPrice(value, lang)}</span>
}

export function Tags({ product, limit = 3 }) {
  const { meta, lang, t } = useMenu()
  const label = (code) => meta?.dietary.find((d) => d.code === code)?.[lang] || code
  const tags = []
  if (product.is_popular) tags.push({ code: 'popular', text: t.popular, Icon: Star })
  product.dietary.forEach((code) => tags.push({ code, text: label(code), Icon: DIET_ICONS[code] }))
  if (!tags.length) return null
  return (
    <span className="tags">
      {tags.slice(0, limit).map(({ code, text, Icon }) => (
        <span key={code} className={`tag tag--${code}`}>
          {Icon && <Icon size={12} aria-hidden="true" />}
          {text}
        </span>
      ))}
    </span>
  )
}

/** Çağrı bekliyorken alt çubuğun üstünde görünen durum satırı. */
export function CallStatus() {
  const { call, t } = useMenu()
  if (!call.pending) return null
  return (
    <p className="call-status" role="status">
      <span className="call-status__dot" aria-hidden="true" />
      {call.current.kind === 'bill' ? t.billPending : t.callPending}
    </p>
  )
}
