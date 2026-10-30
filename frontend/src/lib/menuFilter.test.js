import { describe, expect, it } from 'vitest'
import { countProducts, filterMenu } from './menuFilter'

const product = (name, extra = {}) => ({
  name, name_en: '', description: '', description_en: '', allergens: [], dietary: [], ingredients: [], ...extra,
})
const MENU = [
  {
    id: 1, name: 'Tatlılar', products: [
      product('Fıstıklı baklava', { allergens: ['gluten', 'nuts'], dietary: ['vegetarian'] }),
      product('Kabak tatlısı', { allergens: ['nuts', 'sesame'], dietary: ['vegan'] }),
    ],
  },
  { id: 2, name: 'Çorbalar', products: [product('Mercimek çorbası', { name_en: 'Lentil soup', dietary: ['vegan'] })] },
  { id: 3, name: 'Izgara', products: [product('Adana kebap', { dietary: ['spicy'], ingredients: ['kuzu', 'pul biber'] })] },
]

describe('filterMenu', () => {
  it('returns everything without filters', () => {
    expect(countProducts(filterMenu(MENU))).toBe(4)
  })

  it('hides products containing an excluded allergen and drops empty categories', () => {
    const result = filterMenu(MENU, { excludeAllergens: ['nuts'] })
    expect(result.map((c) => c.name)).toEqual(['Çorbalar', 'Izgara'])
  })

  it('treats vegan products as vegetarian', () => {
    const names = filterMenu(MENU, { dietary: ['vegetarian'] }).flatMap((c) => c.products.map((p) => p.name))
    expect(names).toEqual(['Fıstıklı baklava', 'Kabak tatlısı', 'Mercimek çorbası'])
  })

  it('searches without Turkish case or accent differences', () => {
    expect(countProducts(filterMenu(MENU, { query: 'FISTIK' }))).toBe(1)
    expect(countProducts(filterMenu(MENU, { query: 'corba' }))).toBe(1)
    expect(countProducts(filterMenu(MENU, { query: 'lentil' }))).toBe(1)
    expect(countProducts(filterMenu(MENU, { query: 'pul biber' }))).toBe(1)
  })

  it('combines filters', () => {
    expect(countProducts(filterMenu(MENU, { query: 'tatlı', dietary: ['vegan'] }))).toBe(1)
  })
})
