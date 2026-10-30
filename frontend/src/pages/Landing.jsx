import { Link } from 'react-router-dom'
import { BellRing, BookOpen, ChartColumn, Languages, QrCode, SlidersHorizontal } from 'lucide-react'
import './landing.css'

const DEMOS = [
  {
    theme: 'klasik',
    name: 'Çınaraltı Lokantası',
    slug: 'cinaralti-lokantasi',
    look: 'Klasik tema: İznik mavisi, basılı menü düzeni',
    colors: ['#fbfbf8', '#2155a3', '#b63526'],
  },
  {
    theme: 'bistro',
    name: 'Liman Bistro',
    slug: 'liman-bistro',
    look: 'Bistro tema: kara tahta, iri fiyatlar',
    colors: ['#22282b', '#edeae2', '#e2b33c'],
  },
  {
    theme: 'vitrin',
    name: 'Fıstık Pastanesi',
    slug: 'fistik-pastanesi',
    look: 'Vitrin tema: pastane camekânı, kartlar',
    colors: ['#fff6f1', '#c7325f', '#6f9a4b'],
  },
]

const FEATURES = [
  { icon: QrCode, title: 'Masaya özel QR', text: 'Her masanın kodu menüyü o masa için açar; kartları tek PDF olarak yazdırırsınız.' },
  { icon: BellRing, title: 'Garson çağırma', text: 'Müşteri tek dokunuşla çağırır, panelde sesli uyarıyla anında görünür.' },
  { icon: SlidersHorizontal, title: 'Alerjen süzgeci', text: '14 yasal alerjen grubu ve vegan/vejetaryen etiketleriyle menüyü süzme.' },
  { icon: Languages, title: 'Türkçe ve İngilizce', text: 'Menü telefonun diline göre açılır, tek dokunuşla değişir.' },
  { icon: BookOpen, title: 'Kolay menü yönetimi', text: 'Ürünü pasifleştirince menüden anında kalkar; sıralama ve görseller panelden.' },
  { icon: ChartColumn, title: 'İstatistikler', text: 'Menü ziyaretleri, yoğun saatler, garsonun ortalama yanıt süresi ve puanlar.' },
]

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing__top">
        <span className="brand">
          <QrCode size={22} aria-hidden="true" /> QR Menü
        </span>
        <Link to="/panel/giris" className="landing__login">
          İşletme girişi
        </Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero__text">
            <h1>Masadaki QR kodla menü, alerjen bilgisi ve garson çağırma.</h1>
            <p>
              Restoran ve kafeler için açık kaynak dijital menü. Müşteri uygulama indirmez; işletme menüsünü, masalarını ve
              çağrıları tek panelden yönetir.
            </p>
            <div className="hero__actions">
              <a className="landing__cta" href="/m/cinaralti-lokantasi?masa=demo-klasik-4">
                Masa 4’ten menüyü aç
              </a>
              <Link className="landing__secondary" to="/panel/giris">
                Paneli dene
              </Link>
            </div>
            <p className="hero__hint">
              Panel için demo hesabı: <strong>demo</strong> / <strong>demo-sifre-2026</strong>. Menüden garson çağırın,
              panelde “Garson çağrıları” sayfasında görün.
            </p>
          </div>
          <div className="hero__phone" aria-hidden="true">
            <iframe src="/m/cinaralti-lokantasi?preview=1" title="Örnek menü" tabIndex={-1} loading="lazy" />
          </div>
        </section>

        <section className="demos" aria-labelledby="demos-title">
          <h2 id="demos-title">Aynı menü, üç tema</h2>
          <ul>
            {DEMOS.map((d) => (
              <li key={d.slug}>
                <a href={`/m/${d.slug}?masa=demo-${d.theme}-4`} className="demo">
                  <span className="demo__swatch" aria-hidden="true">
                    {d.colors.map((c) => (
                      <span key={c} style={{ background: c }} />
                    ))}
                  </span>
                  <strong>{d.name}</strong>
                  <span>{d.look}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="features" aria-labelledby="features-title">
          <h2 id="features-title">Neler var?</h2>
          <ul>
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon size={22} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="landing__footer">
        <p>
          Django REST Framework ve React ile geliştirildi. Kaynak kod ve API dokümantasyonu:{' '}
          <a href="https://github.com/melisayalcinkaya/qr_menus">GitHub</a>,{' '}
          <a href="/api/docs/">API</a>
        </p>
        <p>Demo verileri kurgusaldır.</p>
      </footer>
    </div>
  )
}
