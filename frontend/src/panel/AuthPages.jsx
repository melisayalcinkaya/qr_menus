import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QrCode } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { FieldError } from './ui'

function AuthShell({ title, children, footer }) {
  return (
    <main className="auth">
      <div className="auth__intro">
        <Link to="/" className="brand">
          <QrCode size={22} aria-hidden="true" /> QR Menü
        </Link>
        <p className="auth__pitch">Menünüzü güncelleyin, masalardan gelen çağrıları anında görün.</p>
      </div>
      <section className="auth__form" aria-labelledby="auth-title">
        <h1 id="auth-title">{title}</h1>
        {children}
        <p className="auth__switch">{footer}</p>
      </section>
    </main>
  )
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/panel" replace />

  async function submit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await login(form.get('username'), form.get('password'))
      navigate(location.state?.from || '/panel', { replace: true })
    } catch (err) {
      setError(err.status === 401 ? 'Kullanıcı adı ya da şifre hatalı.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Panele giriş"
      footer={
        <>
          Hesabınız yok mu? <Link to="/panel/kayit">Kayıt olun</Link>
        </>
      }
    >
      <div className="demo-hint">
        <p>Denemek için demo hesabı:</p>
        <p>
          <strong>demo</strong> / <strong>demo-sifre-2026</strong>
        </p>
      </div>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Kullanıcı adı</span>
          <input name="username" required autoComplete="username" autoCapitalize="none" />
        </label>
        <label className="field">
          <span>Şifre</span>
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/panel" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      await register(Object.fromEntries(new FormData(e.currentTarget)))
      navigate('/panel', { replace: true })
    } catch (err) {
      setErrors(Object.keys(err.fieldErrors).length ? err.fieldErrors : { form: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="İşletme hesabı oluşturun"
      footer={
        <>
          Zaten hesabınız var mı? <Link to="/panel/giris">Giriş yapın</Link>
        </>
      }
    >
      <form className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span>Kullanıcı adı</span>
          <input name="username" required autoComplete="username" autoCapitalize="none" aria-invalid={!!errors.username} />
          <FieldError errors={errors.username} />
        </label>
        <label className="field">
          <span>E-posta</span>
          <input name="email" type="email" required autoComplete="email" aria-invalid={!!errors.email} />
          <FieldError errors={errors.email} />
        </label>
        <label className="field">
          <span>Şifre</span>
          <input name="password" type="password" required autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="pw-hint" />
          <small id="pw-hint" className="field__hint">
            En az 8 karakter; yalnızca rakam ya da çok yaygın bir şifre olamaz.
          </small>
          <FieldError errors={errors.password} />
        </label>
        <label className="field">
          <span>Şifre (tekrar)</span>
          <input name="password2" type="password" required autoComplete="new-password" aria-invalid={!!errors.password2} />
          <FieldError errors={errors.password2} />
        </label>
        <FieldError errors={errors.form || errors.non_field_errors} />
        <button className="btn btn--primary" disabled={busy}>
          {busy ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
        </button>
      </form>
    </AuthShell>
  )
}
