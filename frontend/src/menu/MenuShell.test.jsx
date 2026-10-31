import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MenuShell from './MenuShell'

// jsdom <dialog> yöntemlerini desteklemez; panellerin açılması için basit karşılıklar
HTMLDialogElement.prototype.showModal = function () {
  this.open = true
}
HTMLDialogElement.prototype.close = function () {
  this.open = false
}
window.scrollTo = () => {}

const product = (id, name, extra = {}) => ({
  id, name, name_en: '', description: '', description_en: '', price: '95.00', image: null,
  is_popular: false, preparation_time: 5, ingredients: [], allergens: [], dietary: [], ...extra,
})

function menuData(theme) {
  return {
    name: 'Deneme Lokantası', slug: 'deneme', logo: null, theme,
    tagline: 'Taze ve sıcak', tagline_en: '', about: '', about_en: '',
    wifi: { ssid: 'Misafir', password: '123' },
    table: { label: '4', token: 'tok' },
    categories: [
      { id: 1, name: 'Çorbalar', name_en: 'Soups', icon: 'soup', image: null, products: [product(10, 'Mercimek', { is_popular: true })] },
      { id: 2, name: 'Tatlılar', name_en: 'Desserts', icon: 'dessert', image: null, products: [product(20, 'Sütlaç', { allergens: ['milk'] })] },
    ],
  }
}

const meta = {
  allergens: [{ code: 'milk', tr: 'Süt', en: 'Milk' }],
  dietary: [{ code: 'vegan', tr: 'Vegan', en: 'Vegan' }],
  themes: [], category_icons: [],
}

function mockApi(theme) {
  const calls = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opts = {}) => {
    calls.push({ url, method: opts.method || 'GET', body: opts.body })
    const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
    if (url.startsWith('/api/meta/')) return json(200, meta)
    if (url.includes('/tables/tok/call/')) return json(404, { detail: 'yok' })
    if (url.endsWith('/waiter-calls/')) {
      const body = JSON.parse(opts.body)
      return json(201, { id: 1, table_label: '4', kind: body.kind, note: body.note, status: 'pending', created_at: new Date().toISOString(), completed_at: null })
    }
    if (url.startsWith('/api/public/deneme/')) return json(200, menuData(theme))
    return json(404, {})
  })
  return calls
}

function renderMenu(path = '/m/deneme?masa=tok') {
  localStorage.setItem('qrmenu-lang', 'tr')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/m/:slug/*" element={<MenuShell />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => vi.restoreAllMocks())

describe.each(['klasik', 'bistro', 'vitrin'])('%s teması', (theme) => {
  it('shows the menu, filters it and opens product details', async () => {
    mockApi(theme)
    renderMenu()
    expect(await screen.findByText('Deneme Lokantası')).toBeInTheDocument()
    expect(screen.getAllByText('Çorbalar').length).toBeGreaterThan(0)

    // Arama Türkçe harfe duyarsız; sonuç kartına basınca ayrıntı açılır
    await userEvent.type(screen.getByRole('searchbox'), 'sutlac')
    expect(await screen.findByText('1 sonuç')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sütlaç ayrıntıları' }))
    const dialog = await screen.findByRole('dialog', { name: 'Sütlaç' })
    expect(within(dialog).getByText('Süt')).toBeInTheDocument()
  })

  it('sends a bill request for the table', async () => {
    const calls = mockApi(theme)
    renderMenu()
    await screen.findByText('Deneme Lokantası')
    const openers = screen.getAllByRole('button', { name: /Hesap iste|Garson çağır/ })
    await userEvent.click(openers[0])
    const dialog = await screen.findByRole('dialog', { name: 'Ne istersiniz?' })
    await userEvent.click(within(dialog).getByLabelText(/Hesap iste/))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Hesap iste' }))
    expect(await screen.findByText(/Hesap isteğiniz iletildi/)).toBeInTheDocument()
    const post = calls.find((c) => c.method === 'POST')
    expect(JSON.parse(post.body)).toMatchObject({ table: 'tok', kind: 'bill' })
  })
})

describe('menu without a table', () => {
  it('asks the guest to scan the table QR before calling', async () => {
    mockApi('klasik')
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const data = { ...menuData('klasik'), table: null }
      const body = url.startsWith('/api/meta/') ? meta : data
      return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    renderMenu('/m/deneme')
    await screen.findByText('Deneme Lokantası')
    await userEvent.click(screen.getByRole('button', { name: 'Garson çağır' }))
    expect(await screen.findByText(/masanızdaki QR kodu okutun/)).toBeInTheDocument()
  })
})
