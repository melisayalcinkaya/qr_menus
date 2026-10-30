import { Link, useOutletContext } from 'react-router-dom'
import { BellRing, MessageSquare } from 'lucide-react'
import { api } from '../lib/api'
import { formatDuration } from '../lib/format'
import { useAsync } from '../lib/useAsync'
import BarChart from './BarChart'
import { LoadState, PageHeader } from './ui'

export default function Overview() {
  const { business, live } = useOutletContext()
  const stats = useAsync(() => api(`/businesses/${business.slug}/stats/?days=30`), [business.slug])
  const s = stats.data

  return (
    <>
      <PageHeader title="Genel bakış">
        <a className="btn" href={`/m/${business.slug}`} target="_blank" rel="noreferrer">
          Menüyü müşteri gibi gör
        </a>
      </PageHeader>

      {(live.calls.length > 0 || s?.comments.pending > 0) && (
        <div className="attention">
          {live.calls.length > 0 && (
            <Link to="cagrilar" className="attention__item attention__item--calls">
              <BellRing size={18} aria-hidden="true" />
              {live.calls.length} masa garson bekliyor
            </Link>
          )}
          {s?.comments.pending > 0 && (
            <Link to="yorumlar" className="attention__item">
              <MessageSquare size={18} aria-hidden="true" />
              {s.comments.pending} yorum onay bekliyor
            </Link>
          )}
        </div>
      )}

      <LoadState state={stats}>
        {s && (
          <>
            <dl className="kpis">
              <div className="kpi">
                <dt>Menü görüntülenme</dt>
                <dd>{s.visits.total.toLocaleString('tr-TR')}</dd>
                <p className="kpi__note">son 30 gün</p>
              </div>
              <div className="kpi">
                <dt>Garson çağrısı</dt>
                <dd>{s.waiter_calls.total.toLocaleString('tr-TR')}</dd>
                <p className="kpi__note">son 30 gün</p>
              </div>
              <div className="kpi">
                <dt>Ortalama yanıt süresi</dt>
                <dd>{formatDuration(s.waiter_calls.avg_response_seconds)}</dd>
                <p className="kpi__note">çağrıdan “tamamlandı”ya</p>
              </div>
              <div className="kpi">
                <dt>Ortalama puan</dt>
                <dd>{s.comments.avg_rating ? s.comments.avg_rating.toLocaleString('tr-TR') : '—'}</dd>
                <p className="kpi__note">{s.comments.approved} onaylı yorum</p>
              </div>
            </dl>

            <div className="charts">
              <section className="card">
                <h2 className="chart-title">Günlük menü görüntülenme</h2>
                <BarChart
                  label="Son 30 günde günlük menü görüntülenme"
                  data={s.visits.series.map((d) => ({ label: d.date, value: d.count }))}
                  formatX={(d) => new Date(d.label).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  tickEvery={7}
                />
              </section>
              <section className="card">
                <h2 className="chart-title">Garson çağrılarının saatlere dağılımı</h2>
                <BarChart
                  label="Son 30 günde saatlere göre garson çağrısı sayısı"
                  data={s.waiter_calls.by_hour.map((d) => ({ label: String(d.hour), value: d.count }))}
                  formatX={(d) => `${d.label.padStart(2, '0')}:00`}
                  tickEvery={3}
                  unit=" çağrı"
                />
              </section>
              <section className="card">
                <h2 className="chart-title">Puan dağılımı</h2>
                <BarChart
                  label="Onaylı yorumların puan dağılımı"
                  data={s.comments.distribution.map((d) => ({ label: String(d.rating), value: d.count }))}
                  formatX={(d) => `${d.label} yıldız`}
                  height={170}
                  unit=" yorum"
                />
              </section>
              <section className="card menu-summary">
                <h2 className="chart-title">Menü</h2>
                <dl>
                  <div>
                    <dt>Kategori</dt>
                    <dd>{s.menu.categories}</dd>
                  </div>
                  <div>
                    <dt>Ürün</dt>
                    <dd>{s.menu.products}</dd>
                  </div>
                  <div>
                    <dt>Masa</dt>
                    <dd>{s.menu.tables}</dd>
                  </div>
                </dl>
                <p>
                  <Link to="menu">Menüyü düzenle</Link> ya da <Link to="masalar">masa QR kodlarını yazdır</Link>.
                </p>
              </section>
            </div>
          </>
        )}
      </LoadState>
    </>
  )
}
