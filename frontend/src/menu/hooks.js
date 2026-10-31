// Temaların ortak kancaları
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useMenu } from './MenuContext'

/** Ürün kartına basınca ayrıntı paneli açılır (alerjenler, içindekiler, hazırlık süresi). */
export function useOpenProduct() {
  const { openSheet } = useMenu()
  return (product, category) => openSheet('product', { product, category })
}

/** URL'deki kategoriyi bulur; süzgeçler o kategorideki ürünlere de uygulanır. */
export function useCurrentCategory() {
  const { categoryId } = useParams()
  const { data, visible } = useMenu()
  const id = Number(categoryId)
  const category = data.categories.find((c) => c.id === id)
  const filtered = visible.find((c) => c.id === id)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])
  return { category, products: filtered?.products || [] }
}

/** Arama varsa tüm kategorilerdeki eşleşen ürünler (kategorisiyle birlikte). */
export function useSearchResults() {
  const { query, visible } = useMenu()
  if (!query.trim()) return null
  return visible.flatMap((c) => c.products.map((p) => ({ product: p, category: c })))
}

/** Dil düğmesi: kısa etiket görünür, ekran okuyucu ne yapacağını duyar. */
export function useLanguageToggle() {
  const { lang, setLang, t } = useMenu()
  return {
    onClick: () => setLang(lang === 'tr' ? 'en' : 'tr'),
    'aria-label': t.languageLabel,
    title: t.languageLabel,
    lang: lang === 'tr' ? 'en' : 'tr',
  }
}
