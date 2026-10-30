import { Link } from 'react-router-dom'
import './landing.css'

export default function NotFound() {
  return (
    <main className="landing landing--center">
      <h1>Sayfa bulunamadı</h1>
      <p>Adresi kontrol edin ya da ana sayfaya dönün.</p>
      <Link className="landing__cta" to="/">Ana sayfa</Link>
    </main>
  )
}
