import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductItem from './ProductItem'

const meta = { allergens: [{ code: 'milk', tr: 'Süt', en: 'Milk' }], dietary: [{ code: 'vegan', tr: 'Vegan', en: 'Vegan' }] }
const product = {
  id: 1, name: 'Sütlaç', name_en: 'Rice pudding', description: 'Fırında', description_en: '', price: '120.00',
  image: null, is_popular: true, preparation_time: 3, ingredients: ['süt', 'pirinç'], allergens: ['milk'], dietary: [],
}

describe('ProductItem', () => {
  it('shows allergens only after expanding, with aria-expanded', async () => {
    render(<ul><ProductItem product={product} category={{ icon: 'dessert' }} lang="tr" meta={meta} /></ul>)
    const button = screen.getByRole('button', { name: /Sütlaç/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Süt')).not.toBeVisible()
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Süt$/)).toBeVisible()
  })

  it('falls back to Turkish when an English field is empty', () => {
    render(<ul><ProductItem product={product} category={{ icon: 'dessert' }} lang="en" meta={meta} /></ul>)
    expect(screen.getByText('Rice pudding')).toBeInTheDocument()
    expect(screen.getByText('Fırında')).toBeInTheDocument()
  })
})
