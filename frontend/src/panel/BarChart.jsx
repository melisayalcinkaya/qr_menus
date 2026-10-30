import { useEffect, useId, useRef, useState } from 'react'
import { niceMax } from '../lib/chart'

const PAD = { top: 22, right: 8, bottom: 26, left: 36 }


/**
 * Tek seriden oluşan sütun grafiği.
 * - En yüksek değer doğrudan etiketlenir, diğerleri üzerine gelince/odaklanınca görünür.
 * - Aynı veri bir tabloyla da sunulur (ekran okuyucu ve renk görme farklılıkları için).
 */
export default function BarChart({ data, label, formatX = (d) => d.label, tickEvery = 1, height = 200, unit = '' }) {
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(600)
  const [hover, setHover] = useState(null)
  const tableId = useId()

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const max = niceMax(Math.max(...data.map((d) => d.value)))
  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const band = plotW / data.length
  const barW = Math.min(24, Math.max(3, band - 2)) // en fazla 24px, aralarında en az 2px boşluk
  const y = (v) => PAD.top + plotH - (v / max) * plotH
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0)
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i)

  return (
    <figure className="chart" ref={wrapRef}>
      <svg width={width} height={height} role="img" aria-label={`${label}. Ayrıntılar aşağıdaki tabloda.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart__grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="chart__tick" x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
              {t.toLocaleString('tr-TR')}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + band * i + band / 2
          const h = Math.max(0, PAD.top + plotH - y(d.value))
          const r = Math.min(4, h, barW / 2)
          const x0 = cx - barW / 2
          const top = y(d.value)
          // Üst köşeleri yuvarlak, tabanı düz sütun
          const path = h
            ? `M${x0},${top + h} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${top + h} Z`
            : ''
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${formatX(d)}: ${d.value}${unit}`}
            >
              <rect className="chart__hit" x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} />
              {path && <path className={`chart__bar${hover === i ? ' is-hover' : ''}`} d={path} />}
              {i % tickEvery === 0 && (
                <text className="chart__tick" x={cx} y={height - 8} textAnchor="middle">
                  {formatX(d)}
                </text>
              )}
              {i === peak && d.value > 0 && hover === null && (
                <text className="chart__value" x={cx} y={top - 6} textAnchor="middle">
                  {d.value}
                </text>
              )}
            </g>
          )
        })}
        {hover !== null && (
          <Tooltip
            x={PAD.left + band * hover + band / 2}
            y={y(data[hover].value)}
            width={width}
            text={`${formatX(data[hover])}: ${data[hover].value}${unit}`}
          />
        )}
      </svg>
      <details className="chart__table">
        <summary aria-controls={tableId}>Tablo olarak göster</summary>
        <table id={tableId} className="table">
          <caption className="visually-hidden">{label}</caption>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{formatX(d)}</th>
                <td>
                  {d.value}
                  {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

function Tooltip({ x, y, width, text }) {
  const w = text.length * 7 + 16
  const left = Math.min(Math.max(x - w / 2, 2), width - w - 2)
  const top = Math.max(2, y - 34)
  return (
    <g className="chart__tooltip" pointerEvents="none">
      <rect x={left} y={top} width={w} height={24} rx={6} />
      <text x={left + w / 2} y={top + 16} textAnchor="middle">
        {text}
      </text>
    </g>
  )
}
