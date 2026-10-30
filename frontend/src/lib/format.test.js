import { describe, expect, it } from 'vitest'
import { formatDuration, formatPrice, searchKey, tableName, timeAgo } from './format'
import { niceMax } from './chart'

describe('format helpers', () => {
  it('formats prices with the lira sign', () => {
    expect(formatPrice('95.00')).toBe('₺95')
    expect(formatPrice('1250.5')).toBe('₺1.250,5')
  })

  it('names tables', () => {
    expect(tableName('5')).toBe('Masa 5')
    expect(tableName('Bahçe 1')).toBe('Bahçe 1')
    expect(tableName('12', 'Table')).toBe('Table 12')
  })

  it('normalises Turkish text for search', () => {
    expect(searchKey('IŞIK Çorbası')).toBe(searchKey('ışık corbasi'))
    expect(searchKey('İzmir')).toBe('izmir')
  })

  it('describes durations and relative time', () => {
    expect(formatDuration(148)).toBe('2 dk 28 sn')
    expect(formatDuration(null)).toBe('—')
    const now = Date.parse('2026-10-30T12:00:00Z')
    expect(timeAgo('2026-10-30T11:57:00Z', now)).toBe('3 dk önce')
  })

  it('picks round axis maxima', () => {
    expect(niceMax(109)).toBe(200)
    expect(niceMax(36)).toBe(40)
    expect(niceMax(3)).toBe(4)
    expect(niceMax(0)).toBe(4)
  })
})
