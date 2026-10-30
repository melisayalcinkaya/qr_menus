import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import Sheet from '../components/Sheet'

export default function WifiSheet({ open, onClose, wifi, t }) {
  return (
    <Sheet open={open} onClose={onClose} title={t.wifiTitle} closeLabel={t.close}>
      <dl className="wifi">
        <CopyRow label={t.network} value={wifi.ssid} t={t} />
        {wifi.password && <CopyRow label={t.password} value={wifi.password} t={t} />}
      </dl>
    </Sheet>
  )
}

function CopyRow({ label, value, t }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* pano izni yoksa kullanıcı metni elle seçebilir */
    }
  }
  return (
    <div className="wifi__row">
      <dt>{label}</dt>
      <dd>
        <code>{value}</code>
        <button type="button" className="menu-chip" onClick={copy}>
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          <span aria-live="polite">{copied ? t.copied : t.copy}</span>
        </button>
      </dd>
    </div>
  )
}
