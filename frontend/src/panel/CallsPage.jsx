import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, Volume2, VolumeX, X } from 'lucide-react'
import { apiList } from '../lib/api'
import { tableName, timeAgo } from '../lib/format'
import { PageHeader } from './ui'
import { useToast } from './Toast'
import { playChime, unlockAudio } from './useLiveCalls'

export default function CallsPage() {
  const { business, live, sound, setSound } = useOutletContext()
  const toast = useToast()
  const [now, setNow] = useState(() => Date.now())
  const [history, setHistory] = useState([])

  // "3 dk önce" metinleri kendiliğinden güncellensin
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    apiList(`/waiter-calls/?business=${business.slug}&status=completed`)
      .then((list) => setHistory(list.slice(0, 8)))
      .catch(() => {})
  }, [business.slug, live.calls.length])

  async function close(call, action) {
    try {
      await live.close(call, action)
      toast(action === 'complete' ? `${tableName(call.table_label)} tamamlandı` : `${tableName(call.table_label)} iptal edildi`)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  function toggleSound() {
    if (!sound) {
      unlockAudio() // tarayıcılar sesi ancak bir tıklamadan sonra çalmaya izin verir
      playChime()
    }
    setSound(!sound)
  }

  return (
    <>
      <PageHeader title="Garson çağrıları">
        <button type="button" className="btn" onClick={toggleSound} aria-pressed={sound}>
          {sound ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
          {sound ? 'Sesli uyarı açık' : 'Sesli uyarıyı aç'}
        </button>
      </PageHeader>

      {live.error && (
        <p className="notice notice--error" role="alert">
          Çağrılar güncellenemiyor: {live.error.message} Bağlantı gelince otomatik yenilenecek.
        </p>
      )}

      <section aria-labelledby="pending-title">
        <h2 id="pending-title" className="section-title">
          Bekleyen <span className="muted">({live.calls.length})</span>
        </h2>
        {live.calls.length === 0 ? (
          <div className="empty">
            <p>Şu an bekleyen çağrı yok.</p>
            <p className="muted">
              Müşteri masadaki QR koddan “Garson çağır”a bastığında burada görünür; bu sayfa 5 saniyede bir yenilenir.
            </p>
          </div>
        ) : (
          <ul className="call-board">
            {live.calls.map((call) => (
              <li key={call.id} className={`call-card${live.newIds.includes(call.id) ? ' is-new' : ''}`}>
                <p className="call-card__table">{tableName(call.table_label)}</p>
                <p className="call-card__time">
                  <time dateTime={call.created_at}>{timeAgo(call.created_at, now)}</time>
                </p>
                {call.note && <p className="call-card__note">“{call.note}”</p>}
                <div className="call-card__actions">
                  <button type="button" className="btn btn--primary" onClick={() => close(call, 'complete')}>
                    <Check size={16} aria-hidden="true" /> Tamamlandı
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => close(call, 'cancel')}
                    aria-label={`${tableName(call.table_label)} çağrısını iptal et`}
                  >
                    <X size={16} aria-hidden="true" /> İptal
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section aria-labelledby="history-title" className="section">
          <h2 id="history-title" className="section-title">
            Son tamamlananlar
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Masa</th>
                <th scope="col">Çağrı</th>
                <th scope="col">Yanıt süresi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((c) => (
                <tr key={c.id}>
                  <td>{c.table_label}</td>
                  <td>{timeAgo(c.created_at, now)}</td>
                  <td>{Math.max(1, Math.round((new Date(c.completed_at) - new Date(c.created_at)) / 60000))} dk</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  )
}
