import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Copy, Download, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react'
import { api, apiList, downloadFile, fetchObjectUrl } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import { FieldError, LoadState, PageHeader } from './ui'
import { useToast } from './Toast'
import { tableName } from '../lib/format'

export default function TablesPage() {
  const { business } = useOutletContext()
  const toast = useToast()
  const state = useAsync(() => apiList(`/tables/?business=${business.slug}`), [business.slug])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function addTables(labels) {
    setBusy(true)
    setError(null)
    const existing = new Set(state.data.map((t) => t.label.toLocaleLowerCase('tr')))
    const fresh = labels.filter((l) => !existing.has(l.toLocaleLowerCase('tr')))
    try {
      let position = state.data.length
      for (const label of fresh) {
        await api('/tables/', { method: 'POST', body: { business: business.slug, label, position: position++ } })
      }
      toast(fresh.length === 1 ? `${tableName(fresh[0])} eklendi` : `${fresh.length} masa eklendi`)
      state.reload()
    } catch (err) {
      setError(err.fieldErrors.label || err.message)
      state.reload()
    } finally {
      setBusy(false)
    }
  }

  function submitSingle(e) {
    e.preventDefault()
    const label = new FormData(e.currentTarget).get('label').trim()
    if (label) addTables([label])
    e.currentTarget.reset()
  }

  function submitRange(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const from = Number(form.get('from'))
    const to = Number(form.get('to'))
    if (!(from >= 1 && to >= from && to - from < 100)) {
      setError('Geçerli bir aralık girin (en fazla 100 masa).')
      return
    }
    addTables(Array.from({ length: to - from + 1 }, (_, i) => String(from + i)))
  }

  async function regenerate(table) {
    if (!window.confirm(`${tableName(table.label)} için yeni QR kod üretilsin mi? Basılı eski kod artık çalışmaz.`)) return
    try {
      await api(`/tables/${table.id}/regenerate-token/`, { method: 'POST' })
      toast(`${tableName(table.label)} için yeni QR kod üretildi`)
      state.reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function remove(table) {
    if (!window.confirm(`${tableName(table.label)} silinsin mi?`)) return
    try {
      await api(`/tables/${table.id}/`, { method: 'DELETE' })
      toast(`${tableName(table.label)} silindi`)
      state.reload()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <>
      <PageHeader title="Masalar ve QR kodlar">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!state.data?.length}
          onClick={() =>
            downloadFile(`/businesses/${business.slug}/table-cards/`, `${business.slug}-masalar.pdf`).catch((err) =>
              toast(err.message, 'error'),
            )
          }
        >
          <Printer size={16} aria-hidden="true" /> Tüm masa kartlarını indir (PDF)
        </button>
      </PageHeader>

      <p className="lead">
        Her masanın QR kodu menüyü o masaya özel açar; müşteri “Garson çağır”a bastığında hangi masadan geldiğini görürsünüz.
      </p>

      <div className="table-forms card">
        <form className="inline-form" onSubmit={submitSingle}>
          <label className="field">
            <span>Masa adı</span>
            <input name="label" required maxLength={20} placeholder="Örn. 12 ya da Bahçe 3" />
          </label>
          <button className="btn" disabled={busy}>
            <Plus size={16} aria-hidden="true" /> Ekle
          </button>
        </form>
        <form className="inline-form" onSubmit={submitRange}>
          <label className="field field--short">
            <span>Toplu: şu numaradan</span>
            <input name="from" type="number" min={1} defaultValue={1} />
          </label>
          <label className="field field--short">
            <span>şu numaraya</span>
            <input name="to" type="number" min={1} defaultValue={10} />
          </label>
          <button className="btn" disabled={busy}>
            <Plus size={16} aria-hidden="true" /> Toplu ekle
          </button>
        </form>
        <FieldError errors={error} />
      </div>

      <LoadState
        state={state}
        empty={{ when: state.data?.length === 0, node: <p className="empty">Henüz masa yok. Yukarıdan ekleyebilirsiniz.</p> }}
      >
        <ul className="qr-grid">
          {state.data?.map((table) => (
            <TableCard key={table.id} table={table} onRegenerate={regenerate} onRemove={remove} />
          ))}
        </ul>
      </LoadState>
    </>
  )
}

function TableCard({ table, onRegenerate, onRemove }) {
  const toast = useToast()
  const [src, setSrc] = useState(null)

  // QR görseli kimlik doğrulamalı uç noktadan gelir; <img src> başlık gönderemediği için blob URL kullanıyoruz
  useEffect(() => {
    let url
    fetchObjectUrl(`/tables/${table.id}/qr/`)
      .then((u) => setSrc((url = u)))
      .catch(() => setSrc(null))
    return () => url && URL.revokeObjectURL(url)
  }, [table.id, table.token])

  return (
    <li className="qr-card">
      <h2 className="qr-card__label">{tableName(table.label)}</h2>
      {src ? <img src={src} alt={`${tableName(table.label)} QR kodu`} width={160} height={160} /> : <div className="qr-card__ph" />}
      <div className="qr-card__actions">
        <button
          type="button"
          className="icon-button"
          aria-label={`${tableName(table.label)} QR kodunu indir`}
          title="PNG indir"
          onClick={() => downloadFile(`/tables/${table.id}/qr/`, `masa-${table.label}.png`)}
        >
          <Download size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={`${tableName(table.label)} bağlantısını kopyala`}
          title="Bağlantıyı kopyala"
          onClick={() => navigator.clipboard.writeText(table.menu_url).then(() => toast('Bağlantı kopyalandı'))}
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={`${tableName(table.label)} için yeni QR kod üret`}
          title="Yeni QR kod üret"
          onClick={() => onRegenerate(table)}
        >
          <RefreshCw size={16} />
        </button>
        <button
          type="button"
          className="icon-button icon-button--danger"
          aria-label={`${tableName(table.label)} sil`}
          title="Sil"
          onClick={() => onRemove(table)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  )
}
