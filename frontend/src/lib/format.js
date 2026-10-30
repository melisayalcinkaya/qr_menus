const formatters = {}

export function formatPrice(value, lang = 'tr') {
  const key = lang
  formatters[key] ??= new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'tr-TR', {
    style: 'currency',
    currency: 'TRY',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })
  return formatters[key].format(Number(value))
}

export function formatDuration(seconds) {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m ? `${m} dk ${s} sn` : `${s} sn`
}

export function timeAgo(iso, now = Date.now()) {
  const diff = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (diff < 60) return 'az önce'
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

/** Türkçe büyük/küçük harf ve aksan farklarını yok sayan arama anahtarı. */
export function searchKey(text) {
  return (text || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
}

/** "5" -> "Masa 5", "Bahçe 1" -> "Bahçe 1" (sayı olmayan etiketin başına "Masa" eklenmez) */
export function tableName(label, word = 'Masa') {
  return /^\d+$/.test(String(label).trim()) ? `${word} ${label}` : String(label)
}
