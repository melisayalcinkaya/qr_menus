import { describe, expect, it } from 'vitest'
import { STRINGS, pick } from './i18n'

describe('i18n', () => {
  it('has the same keys in Turkish and English', () => {
    expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.tr).sort())
  })

  it('falls back to Turkish when the English field is empty', () => {
    expect(pick({ name: 'Mantı', name_en: '' }, 'name', 'en')).toBe('Mantı')
    expect(pick({ name: 'Mantı', name_en: 'Dumplings' }, 'name', 'en')).toBe('Dumplings')
  })

  it('pluralises English counts', () => {
    expect(STRINGS.en.productCount(1)).toBe('1 item')
    expect(STRINGS.en.productCount(3)).toBe('3 items')
  })
})
