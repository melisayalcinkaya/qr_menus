import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../lib/api'
import { FieldError, PageHeader } from './ui'
import { useToast } from './Toast'

const THEMES = [
  { code: 'klasik', label: 'Klasik', hint: 'İznik mavisi, noktalı fiyat çizgisi', colors: ['#fbfbf8', '#2155a3', '#b63526'] },
  { code: 'bistro', label: 'Bistro', hint: 'Kara tahta, iri hardal fiyatlar', colors: ['#22282b', '#edeae2', '#e2b33c'] },
  { code: 'vitrin', label: 'Vitrin', hint: 'Pastane camekânı, görselli kartlar', colors: ['#fff6f1', '#c7325f', '#6f9a4b'] },
]

export default function SettingsPage() {
  const { business, setBusiness, reloadBusinesses } = useOutletContext()
  const toast = useToast()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(business.theme)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  async function save(e) {
    e.preventDefault()
    const raw = new FormData(e.currentTarget)
    const body = new FormData()
    body.append('name', raw.get('name'))
    body.append('theme', theme)
    body.append('wifi_ssid', raw.get('wifi_ssid'))
    body.append('wifi_password', raw.get('wifi_password'))
    body.append('wifi_enabled', raw.get('wifi_enabled') ? 'true' : 'false')
    const logo = raw.get('logo')
    if (logo && logo.size) body.append('logo', logo)

    setBusy(true)
    setErrors({})
    try {
      const saved = await api(`/businesses/${business.slug}/`, { method: 'PATCH', body })
      setBusiness(saved)
      reloadBusinesses()
      toast('Ayarlar kaydedildi')
    } catch (err) {
      setErrors(Object.keys(err.fieldErrors).length ? err.fieldErrors : { form: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function destroy() {
    const typed = window.prompt(`Bu işlem geri alınamaz. Silmek için işletme adını yazın: ${business.name}`)
    if (typed !== business.name) return
    try {
      await api(`/businesses/${business.slug}/`, { method: 'DELETE' })
      navigate('/panel', { replace: true })
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title="Ayarlar" />
      <div className="settings">
        <form className="form" onSubmit={save}>
          <section className="card form">
            <h2>İşletme</h2>
            <label className="field">
              <span>İşletme adı</span>
              <input name="name" required maxLength={100} defaultValue={business.name} />
              <FieldError errors={errors.name} />
            </label>
            <p className="field__hint">
              Menü adresi: <a href={business.menu_url} target="_blank" rel="noreferrer">{business.menu_url}</a>
              <br />
              Ad değişse de adres aynı kalır; basılı QR kodlar çalışmaya devam eder.
            </p>
            <div className="image-field">
              {business.logo && <img src={business.logo} alt="" className="image-field__preview" />}
              <label className="field">
                <span>Logo (JPEG, PNG ya da WEBP, en fazla 2 MB)</span>
                <input type="file" name="logo" accept="image/jpeg,image/png,image/webp" />
                <FieldError errors={errors.logo} />
              </label>
            </div>
          </section>

          <section className="card form">
            <h2>Menü teması</h2>
            <div className="theme-options" role="radiogroup" aria-label="Menü teması">
              {THEMES.map((t) => (
                <label key={t.code} className="theme-option">
                  <input type="radio" name="theme" value={t.code} checked={theme === t.code} onChange={() => setTheme(t.code)} />
                  <span className="theme-option__swatch" aria-hidden="true">
                    {t.colors.map((c) => (
                      <span key={c} style={{ background: c }} />
                    ))}
                  </span>
                  <span className="theme-option__text">
                    <strong>{t.label}</strong>
                    <small>{t.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="card form">
            <h2>Wi-Fi</h2>
            <div className="form-grid">
              <label className="field">
                <span>Ağ adı</span>
                <input name="wifi_ssid" maxLength={64} defaultValue={business.wifi_ssid} autoComplete="off" />
              </label>
              <label className="field">
                <span>Şifre</span>
                <input name="wifi_password" maxLength={64} defaultValue={business.wifi_password} autoComplete="off" />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" name="wifi_enabled" defaultChecked={business.wifi_enabled} /> Wi-Fi bilgisini menüde göster
            </label>
          </section>

          <FieldError errors={errors.form || errors.theme} />
          <button className="btn btn--primary" disabled={busy}>
            {busy ? 'Kaydediliyor…' : 'Ayarları kaydet'}
          </button>

          <section className="card danger-zone">
            <h2>İşletmeyi sil</h2>
            <p className="muted">Menü, masalar, yorumlar ve çağrı geçmişi kalıcı olarak silinir.</p>
            <button type="button" className="btn btn--danger" onClick={destroy}>
              İşletmeyi sil
            </button>
          </section>
        </form>

        <aside className="preview" aria-label="Menü önizlemesi">
          <p className="muted">Önizleme (kaydetmeden önce temayı deneyebilirsiniz)</p>
          <div className="preview__phone">
            <iframe
              key={theme}
              title={`${THEMES.find((t) => t.code === theme).label} tema önizlemesi`}
              src={`/m/${business.slug}?preview=1&tema=${theme}`}
              loading="lazy"
            />
          </div>
        </aside>
      </div>
    </>
  )
}
