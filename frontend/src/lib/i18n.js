import { tableName } from './format'

// Müşteri menüsünün arayüz metinleri. İçerik (ürün adı vb.) API'den iki dilde gelir.

export const STRINGS = {
  tr: {
    search: 'Menüde ara',
    searchPlaceholder: 'Yemek, içecek ya da malzeme',
    filters: 'Süz',
    filtersTitle: 'Menüyü süz',
    excludeAllergens: 'Şunları içerenleri gizle',
    dietary: 'Yalnızca şunları göster',
    clearFilters: 'Süzgeçleri temizle',
    showResults: (n) => `${n} ürünü göster`,
    noResults: 'Bu süzgeçlere uyan ürün yok.',
    noResultsHint: 'Arama metnini kısaltmayı ya da süzgeçleri kaldırmayı deneyin.',
    popular: 'Sevilen',
    minutes: (n) => `${n} dk`,
    allergens: 'Alerjenler',
    containsNone: 'Bildirilen alerjen yok',
    ingredients: 'İçindekiler',
    wifi: 'Wi-Fi',
    wifiTitle: 'Kablosuz ağ',
    network: 'Ağ adı',
    password: 'Şifre',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    reviews: 'Yorumlar',
    reviewsTitle: 'Misafir yorumları',
    noReviews: 'Henüz onaylanmış yorum yok. İlk yorumu siz yazın.',
    writeReview: 'Yorum yaz',
    yourName: 'Adınız (isteğe bağlı)',
    yourReview: 'Yorumunuz',
    rating: 'Puanınız',
    stars: (n) => `${n} yıldız`,
    sendReview: 'Yorumu gönder',
    reviewSent: 'Teşekkürler! Yorumunuz işletme onayladıktan sonra görünecek.',
    callWaiter: 'Garson çağır',
    table: (label) => tableName(label, 'Masa'),
    callNote: 'Not (isteğe bağlı)',
    callNotePlaceholder: 'Örn. hesap lütfen',
    sendCall: 'Çağrıyı gönder',
    callPending: 'Çağrınız iletildi, garson geliyor.',
    callDone: 'Garson çağrınızı tamamladı.',
    callAgain: 'Yeniden çağır',
    scanTableQr: 'Garson çağırmak için masanızdaki QR kodu okutun.',
    close: 'Kapat',
    loading: 'Menü yükleniyor',
    notFound: 'Bu adreste bir menü bulunamadı.',
    retry: 'Tekrar dene',
    language: 'English',
    categories: 'Kategoriler',
    priceNote: 'Fiyatlara KDV dahildir.',
  },
  en: {
    search: 'Search the menu',
    searchPlaceholder: 'Dish, drink or ingredient',
    filters: 'Filter',
    filtersTitle: 'Filter the menu',
    excludeAllergens: 'Hide items containing',
    dietary: 'Only show',
    clearFilters: 'Clear filters',
    showResults: (n) => `Show ${n} items`,
    noResults: 'Nothing matches these filters.',
    noResultsHint: 'Try a shorter search or remove some filters.',
    popular: 'Favourite',
    minutes: (n) => `${n} min`,
    allergens: 'Allergens',
    containsNone: 'No allergens declared',
    ingredients: 'Ingredients',
    wifi: 'Wi-Fi',
    wifiTitle: 'Wireless network',
    network: 'Network',
    password: 'Password',
    copy: 'Copy',
    copied: 'Copied',
    reviews: 'Reviews',
    reviewsTitle: 'Guest reviews',
    noReviews: 'No approved reviews yet. Be the first to write one.',
    writeReview: 'Write a review',
    yourName: 'Your name (optional)',
    yourReview: 'Your review',
    rating: 'Your rating',
    stars: (n) => `${n} star${n > 1 ? 's' : ''}`,
    sendReview: 'Send review',
    reviewSent: 'Thank you! Your review will appear once the venue approves it.',
    callWaiter: 'Call waiter',
    table: (label) => tableName(label, 'Table'),
    callNote: 'Note (optional)',
    callNotePlaceholder: 'e.g. the bill, please',
    sendCall: 'Send call',
    callPending: 'Your call has been sent, a waiter is on the way.',
    callDone: 'The waiter has completed your call.',
    callAgain: 'Call again',
    scanTableQr: 'To call a waiter, scan the QR code on your table.',
    close: 'Close',
    loading: 'Loading the menu',
    notFound: 'There is no menu at this address.',
    retry: 'Try again',
    language: 'Türkçe',
    categories: 'Categories',
    priceNote: 'Prices include VAT.',
  },
}

export function initialLang() {
  try {
    const saved = localStorage.getItem('qrmenu-lang')
    if (saved === 'tr' || saved === 'en') return saved
  } catch {
    /* gizli sekmede localStorage erişilemeyebilir */
  }
  return (navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en'
}

export function saveLang(lang) {
  try {
    localStorage.setItem('qrmenu-lang', lang)
  } catch {
    /* önemli değil */
  }
}

/** İngilizce alan boşsa Türkçeye düşer. */
export function pick(obj, field, lang) {
  return (lang === 'en' && obj[`${field}_en`]) || obj[field]
}
