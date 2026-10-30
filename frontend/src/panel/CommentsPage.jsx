import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Check, Star, Trash2, X } from 'lucide-react'
import { api, apiList } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { LoadState, PageHeader } from './ui'
import { useToast } from './Toast'

const TABS = [
  { status: 'pending', label: 'Onay bekleyen' },
  { status: 'approved', label: 'Yayında' },
  { status: 'rejected', label: 'Reddedilen' },
]

export default function CommentsPage() {
  const { business, setPendingComments } = useOutletContext()
  const toast = useToast()
  const [tab, setTab] = useState('pending')
  const state = useAsync(() => apiList(`/comments/?business=${business.slug}&status=${tab}`), [business.slug, tab])

  async function act(comment, action) {
    try {
      if (action === 'delete') {
        if (!window.confirm('Yorum kalıcı olarak silinsin mi?')) return
        await api(`/comments/${comment.id}/`, { method: 'DELETE' })
      } else {
        await api(`/comments/${comment.id}/${action}/`, { method: 'POST' })
      }
      state.setData((list) => list.filter((c) => c.id !== comment.id))
      if (comment.status === 'pending') setPendingComments((n) => Math.max(0, n - 1))
      toast({ approve: 'Yorum yayınlandı', reject: 'Yorum reddedildi', delete: 'Yorum silindi' }[action])
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title="Yorumlar" />
      <p className="lead">Müşteri yorumları siz onaylayana kadar menüde görünmez. Yorum metni değiştirilemez.</p>
      <div className="tabs" role="tablist" aria-label="Yorum durumu">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            role="tab"
            aria-selected={tab === t.status}
            className="tab"
            onClick={() => setTab(t.status)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <LoadState
          state={state}
          empty={{ when: state.data?.length === 0, node: <p className="empty">Bu bölümde yorum yok.</p> }}
        >
          <ul className="comment-list">
            {state.data?.map((c) => (
              <li key={c.id} className="comment">
                <div className="comment__head">
                  <strong>{c.author_name || 'Misafir'}</strong>
                  <span className="rating" aria-label={`${c.rating} yıldız`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} aria-hidden="true" className={n <= c.rating ? 'is-on' : ''} />
                    ))}
                  </span>
                  <time className="muted" dateTime={c.created_at}>
                    {new Date(c.created_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </div>
                <p className="comment__text">{c.text}</p>
                <div className="comment__actions">
                  {c.status !== 'approved' && (
                    <button type="button" className="btn btn--primary" onClick={() => act(c, 'approve')}>
                      <Check size={16} aria-hidden="true" /> Yayınla
                    </button>
                  )}
                  {c.status !== 'rejected' && (
                    <button type="button" className="btn" onClick={() => act(c, 'reject')}>
                      <X size={16} aria-hidden="true" /> Reddet
                    </button>
                  )}
                  <button type="button" className="btn btn--ghost btn--danger" onClick={() => act(c, 'delete')}>
                    <Trash2 size={16} aria-hidden="true" /> Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </LoadState>
      </div>
    </>
  )
}
