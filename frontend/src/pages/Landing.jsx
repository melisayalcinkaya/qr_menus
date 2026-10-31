import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, BookOpen, ChartColumn, Languages, QrCode, SlidersHorizontal } from 'lucide-react'
import './landing.css'

const DEMOS = [
  {
    theme: 'klasik',
    name: 'Çınaraltı Lokantası',
    slug: 'cinaralti-lokantasi',
    label: 'Klasik',
    look: 'Sarı degrade başlık, görselli kategori kartları',
    colors: ['#ffd43b', '#f5f5f5', '#ea5b1d'],
  },
  {
    theme: 'bistro',
    name: 'Liman Bistro',
    slug: 'liman-bistro',
    label: 'Bistro',
    look: 'Yatay kategori kartları, kırmızı alt çubuk',
    colors: ['#f4f4f4', '#ffffff', '#e5322d'],
  },
  {
    theme: 'vitrin',
    name: 'Fıstık Pastanesi',
    slug: 'fistik-pastanesi',
    label: 'Vitrin',
    look: 'Siyah başlıkta slogan, yana kayan ürün rafları',
    colors: ['#000000', '#f6e3d3', '#df5f78'],
  },
]

const FEATURES = [
  { icon: QrCode, title: 'Masaya özel QR', text: 'Her masanın kodu menüyü o masa için açar; kartları tek PDF olarak yazdırırsınız.' },
  { icon: BellRing, title: 'Garson çağırma ve hesap', text: 'Müşteri tek dokunuşla garson çağırır ya da hesap ister; panelde sesli uyarıyla anında görünür.' },
  { icon: SlidersHorizontal, title: 'Alerjen süzgeci', text: '14 yasal alerjen grubu ve vegan/vejetaryen etiketleriyle menüyü süzme.' },
  { icon: Languages, title: 'Türkçe ve İngilizce', text: 'Menü telefonun diline göre açılır, tek dokunuşla değişir.' },
  { icon: BookOpen, title: 'Kolay menü yönetimi', text: 'Ürünü pasifleştirince menüden anında kalkar; sıralama ve görseller panelden.' },
  { icon: ChartColumn, title: 'İstatistikler', text: 'Menü ziyaretleri, yoğun saatler, garsonun ortalama yanıt süresi ve puanlar.' },
]

const menuUrl = (d) => `/m/${d.slug}?masa=demo-${d.theme}-4`

export default function Landing() {
  const [selected, setSelected] = useState(DEMOS[0])
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
            <h1>Masadaki QR kodla menü, alerjen bilgisi, garson ve hesap.</h1>
            <p>
              Restoran ve kafeler için açık kaynak dijital menü. Müşteri uygulama indirmez; işletme menüsünü, masalarını ve
              çağrıları tek panelden yönetir.
            </p>
            <div className="hero__actions">
              <a className="landing__cta" href={menuUrl(selected)}>
                Masa 4’ten menüyü aç
              </a>
              <Link className="landing__secondary" to="/panel/giris">
                Paneli dene
              </Link>
            </div>
            <p className="hero__hint">
              Panel için demo hesabı: <strong>demo</strong> / <strong>demo-sifre-2026</strong>. Menüden garson çağırın
              ya da hesap isteyin, panelde “Garson çağrıları” sayfasında görün.
            </p>
            {/* Telefonda önizleme gösterilmez; temalar doğrudan menüyü açan bağlantılar olur */}
            <ul className="hero__demo-links" aria-label="Demo menüler">
              {DEMOS.map((d) => (
                <li key={d.slug}>
                  <a href={menuUrl(d)}>
                    <Swatch colors={d.colors} />
                    <span>
                      <strong>{d.name}</strong>
                      <small>{d.label} tema</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="hero__preview">
            <div className="hero__phone">
              <iframe
                key={selected.slug}
                src={`/m/${selected.slug}?preview=1`}
                title={`${selected.name} menü önizlemesi`}
                tabIndex={-1}
                loading="lazy"
              />
            </div>
            <div className="theme-switch" role="radiogroup" aria-label="Menü teması">
              {DEMOS.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  role="radio"
                  aria-checked={selected.slug === d.slug}
                  className="theme-switch__option"
                  onClick={() => setSelected(d)}
                  title={d.look}
                >
                  <Swatch colors={d.colors} />
                  {d.label}
                </button>
              ))}
            </div>
            <p className="theme-switch__caption">
              {selected.name}: {selected.look.toLocaleLowerCase('tr')}
            </p>
          </div>
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

function Swatch({ colors }) {
  return (
    <span className="swatch" aria-hidden="true">
      {colors.map((c) => (
        <span key={c} style={{ background: c }} />
      ))}
    </span>
  )
}
