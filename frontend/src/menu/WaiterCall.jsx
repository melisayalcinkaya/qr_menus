import { useCallback, useEffect, useState } from 'react'
import { BellRing, Check } from 'lucide-react'
import Sheet from '../components/Sheet'
import { api } from '../lib/api'

const POLL_MS = 8000
const RECENT_MS = 15 * 60 * 1000 // tamamlanan çağrı 15 dk boyunca "tamamlandı" olarak görünür

// Eski bir çağrı "tamamlandı" diye gösterilmesin; yalnızca yakın zamanda kapananlar
function withRecency(call) {
  const recent = call.completed_at && Date.now() - new Date(call.completed_at).getTime() < RECENT_MS
  return { ...call, recent }
}

/** Masa QR'ıyla açılan menüde garson çağırma düğmesi ve canlı durum. */
export default function WaiterCall({ slug, table, t }) {
  const [call, setCall] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const statusUrl = `/public/${slug}/tables/${table.token}/call/`

  const refresh = useCallback(
    () =>
      api(statusUrl, { auth: false })
        .then((c) => setCall(withRecency(c)))
        .catch((err) => err.status === 404 && setCall(null)),
    [statusUrl],
  )

  // Sayfa açıldığında masanın açık çağrısı varsa göster
  useEffect(() => {
    refresh()
  }, [refresh])

  // Çağrı bekliyorsa durumu düzenli aralıklarla kontrol et
  useEffect(() => {
    if (call?.status !== 'pending') return
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [call?.status, refresh])

  async function send(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const note = new FormData(e.currentTarget).get('note')
      const created = await api(`/public/${slug}/waiter-calls/`, {
        method: 'POST',
        auth: false,
        body: { table: table.token, note },
      })
      setCall(withRecency(created))
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const pending = call?.status === 'pending'
  const done = call?.status === 'completed' && call.recent

  return (
    <>
      <div className="waiter" aria-live="polite">
        {pending ? (
          <p className="waiter__status">
            <span className="waiter__pulse" aria-hidden="true" />
            {t.callPending}
          </p>
        ) : done ? (
          <button type="button" className="waiter__button waiter__button--done" onClick={() => setOpen(true)} aria-haspopup="dialog">
            <Check size={20} aria-hidden="true" />
            <span>{t.callAgain}</span>
          </button>
        ) : (
          <button type="button" className="waiter__button" onClick={() => setOpen(true)} aria-haspopup="dialog">
            <BellRing size={20} aria-hidden="true" />
            <span>{t.callWaiter}</span>
          </button>
        )}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={t.callWaiter} closeLabel={t.close}>
        <p className="sheet__text">{t.table(table.label)}</p>
        <form onSubmit={send} className="review-form">
          <label className="field">
            <span>{t.callNote}</span>
            <input name="note" maxLength={200} placeholder={t.callNotePlaceholder} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="menu-button menu-button--call" disabled={busy}>
            <BellRing size={18} aria-hidden="true" /> {t.sendCall}
          </button>
        </form>
      </Sheet>
    </>
  )
}
