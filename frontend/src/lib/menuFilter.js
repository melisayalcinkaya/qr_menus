import { searchKey } from './format'

/**
 * Menüyü arama metni, hariç tutulacak alerjenler ve beslenme etiketlerine göre filtreler.
 * Boş kalan kategoriler listeden çıkarılır.
 */
export function filterMenu(categories, { query = '', excludeAllergens = [], dietary = [] } = {}) {
  const q = searchKey(query.trim())
  return categories
    .map((category) => ({
      ...category,
      products: category.products.filter((p) => {
        if (excludeAllergens.some((code) => p.allergens.includes(code))) return false
        if (dietary.some((code) => !matchesDiet(p, code))) return false
        if (!q) return true
        const haystack = searchKey(
          [p.name, p.name_en, p.description, p.description_en, category.name, ...(p.ingredients || [])].join(' '),
        )
        return haystack.includes(q)
      }),
    }))
    .filter((category) => category.products.length > 0)
}

function matchesDiet(product, code) {
  // Vegan bir ürün aynı zamanda vejetaryendir
  if (code === 'vegetarian') return product.dietary.includes('vegetarian') || product.dietary.includes('vegan')
  return product.dietary.includes(code)
}

export function countProducts(categories) {
  return categories.reduce((n, c) => n + c.products.length, 0)
}
