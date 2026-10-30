import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LogOut, Plus } from 'lucide-react'
import { api, apiList } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/useAsync'
import { FieldError, LoadState } from './ui'

/** Giriş sonrası: tek işletme varsa doğrudan ona, yoksa oluşturma formu. */
export default function BusinessList() {
  const state = useAsync(() => apiList('/businesses/'), [])
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [errors, setErrors] = useState(null)

  if (state.data?.length === 1) return <Navigate to={`/panel/${state.data[0].slug}`} replace />

  async function create(e) {
    e.preventDefault()
    setErrors(null)
    try {
      const b = await api('/businesses/', { method: 'POST', body: Object.fromEntries(new FormData(e.currentTarget)) })
      navigate(`/panel/${b.slug}/ayarlar`)
    } catch (err) {
      setErrors(err.fieldErrors.name || err.message)
    }
  }

  return (
    <main className="narrow">
      <header className="page-header">
        <h1>{state.data?.length ? 'İşletmeleriniz' : `Hoş geldiniz, ${user.username}`}</h1>
        <button type="button" className="btn btn--ghost" onClick={logout}>
          <LogOut size={16} aria-hidden="true" /> Çıkış
        </button>
      </header>
      <LoadState state={state}>
        {state.data?.length > 1 && (
          <ul className="business-list">
            {state.data.map((b) => (
              <li key={b.slug}>
                <Link to={`/panel/${b.slug}`}>{b.name}</Link>
              </li>
            ))}
          </ul>
        )}
        <form className="form card" onSubmit={create}>
          <h2>{state.data?.length ? 'Yeni işletme ekle' : 'İlk işletmenizi ekleyin'}</h2>
          <label className="field">
            <span>İşletme adı</span>
            <input name="name" required maxLength={100} placeholder="Örn. Çınaraltı Lokantası" />
          </label>
          <FieldError errors={errors} />
          <button className="btn btn--primary">
            <Plus size={16} aria-hidden="true" /> İşletmeyi oluştur
          </button>
        </form>
      </LoadState>
    </main>
  )
}
