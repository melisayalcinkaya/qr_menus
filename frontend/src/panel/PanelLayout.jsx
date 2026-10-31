import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import {
  BellRing, BookOpen, ChevronDown, ExternalLink, LayoutDashboard, LogOut, MessageSquare, QrCode, Settings, Table2,
} from 'lucide-react'
import { api, apiList } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/useAsync'
import { LoadState } from './ui'
import { playChime, useLiveCalls } from './useLiveCalls'

const NAV = [
  { to: '', label: 'Genel bakış', short: 'Özet', icon: LayoutDashboard, end: true },
  { to: 'cagrilar', label: 'Garson çağrıları', short: 'Çağrılar', icon: BellRing, badge: 'calls' },
  { to: 'menu', label: 'Menü', icon: BookOpen },
  { to: 'masalar', label: 'Masalar ve QR', short: 'Masalar', icon: Table2 },
  { to: 'yorumlar', label: 'Yorumlar', icon: MessageSquare, badge: 'comments' },
  { to: 'ayarlar', label: 'Ayarlar', icon: Settings },
]

export default function PanelLayout() {
  const { slug } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const business = useAsync(() => api(`/businesses/${slug}/`), [slug])
  const businesses = useAsync(() => apiList('/businesses/'), [])
  const live = useLiveCalls(slug)
  const [pendingComments, setPendingComments] = useState(0)
  const [sound, setSound] = useState(() => localStorage.getItem('qrmenu-sound') === 'on')

  useEffect(() => {
    api(`/comments/?business=${slug}&status=pending`)
      .then((page) => setPendingComments(page.count))
      .catch(() => {})
  }, [slug])

  // Yeni çağrı geldiğinde ses ve sekme başlığı
  useEffect(() => {
    if (live.newIds.length && sound) playChime()
  }, [live.newIds, sound])

  useEffect(() => {
    const name = business.data?.name || 'Panel'
    document.title = live.calls.length ? `(${live.calls.length}) ${name}` : name
  }, [live.calls.length, business.data])

  const badges = { calls: live.calls.length, comments: pendingComments }

  return (
    <div className="shell">
      <aside className="shell__nav" aria-label="Panel menüsü">
        <div className="shell__brand">
          <QrCode size={20} aria-hidden="true" />
          {businesses.data?.length > 1 ? (
            <BusinessSwitch businesses={businesses.data} slug={slug} onChange={(s) => navigate(`/panel/${s}`)} />
          ) : (
            <strong>{business.data?.name || '…'}</strong>
          )}
        </div>
        <nav>
          <ul className="shell__links">
            {NAV.map(({ to, label, short, icon: Icon, end, badge }) => (
              <li key={to}>
                <NavLink to={to} end={end} className="shell__link">
                  <Icon size={19} aria-hidden="true" />
                  <span className={short ? 'shell__label shell__label--long' : 'shell__label'}>{label}</span>
                  {/* Telefondaki alt çubukta altı sekme sığsın diye kısa ad; ekran okuyucu uzun adı okur */}
                  {short && (
                    <span className="shell__label shell__label--short" aria-hidden="true">
                      {short}
                    </span>
                  )}
                  {badge && badges[badge] > 0 && (
                    <span className={`count count--${badge}`}>
                      {badges[badge]}
                      <span className="visually-hidden"> bekleyen</span>
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="shell__footer">
          {business.data && (
            <a className="shell__link" href={`/m/${slug}`} target="_blank" rel="noreferrer">
              <ExternalLink size={19} aria-hidden="true" />
              <span className="shell__label">Menüyü aç</span>
            </a>
          )}
          <button type="button" className="shell__link" onClick={logout}>
            <LogOut size={19} aria-hidden="true" />
            <span className="shell__label">Çıkış ({user?.username})</span>
          </button>
        </div>
      </aside>

      {/* Telefonda kenar menüsü alt sekme çubuğuna dönüşür; işletme, menü ve çıkış burada kalır */}
      <header className="shell__mobilebar">
        {businesses.data?.length > 1 ? (
          <BusinessSwitch businesses={businesses.data} slug={slug} onChange={(s) => navigate(`/panel/${s}`)} />
        ) : (
          <strong>{business.data?.name || '…'}</strong>
        )}
        <a className="icon-button" href={`/m/${slug}`} target="_blank" rel="noreferrer" aria-label="Menüyü aç" title="Menüyü aç">
          <ExternalLink size={19} />
        </a>
        <button type="button" className="icon-button" onClick={logout} aria-label={`Çıkış (${user?.username})`} title="Çıkış">
          <LogOut size={19} />
        </button>
      </header>

      <main className="shell__main" id="icerik">
        <LoadState state={business}>
          <Outlet
            context={{
              business: business.data,
              setBusiness: business.setData,
              reloadBusinesses: businesses.reload,
              live,
              sound,
              setSound: (on) => {
                setSound(on)
                localStorage.setItem('qrmenu-sound', on ? 'on' : 'off')
              },
              setPendingComments,
            }}
          />
        </LoadState>
      </main>
    </div>
  )
}

/** İşletme seçici. Yerel ok yerine kendi okumuz: koyu temada tarayıcının beyaz ok kutusu çıkmasın. */
function BusinessSwitch({ businesses, slug, onChange }) {
  return (
    <label className="business-switch">
      <span className="visually-hidden">İşletme seçin</span>
      <select value={slug} onChange={(e) => onChange(e.target.value)}>
        {businesses.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown className="business-switch__chevron" size={16} aria-hidden="true" />
    </label>
  )
}
