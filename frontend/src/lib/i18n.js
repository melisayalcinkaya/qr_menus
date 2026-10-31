import { tableName } from './format'

// Müşteri menüsünün arayüz metinleri. İçerik (ürün adı vb.) API'den iki dilde gelir.

export const STRINGS = {
  tr: {
    search: 'Menüde ara',
    searchPlaceholder: 'Ne yemek istersiniz?',
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
    callNotePlaceholder: 'Örn. iki su alabilir miyiz?',
    sendCall: 'Çağrıyı gönder',
    callPending: 'Çağrınız iletildi, garson geliyor.',
    callDone: 'Garson çağrınızı tamamladı.',
    callAgain: 'Yeniden çağır',
    scanTableQr: 'Garson çağırmak ya da hesap istemek için masanızdaki QR kodu okutun.',
    requestBill: 'Hesap iste',
    callTitle: 'Ne istersiniz?',
    callWaiterHint: 'Sipariş, su, peçete…',
    requestBillHint: 'Garson hesapla masanıza gelir',
    billPending: 'Hesap isteğiniz iletildi, garson geliyor.',
    callSent: 'İletildi',
    home: 'Menü',
    language: 'English',
    languageLabel: 'Dili değiştir: English',
    categories: 'Kategoriler',
    allCategories: 'Tüm kategoriler',
    seeAll: 'Tümünü gör',
    seeLess: 'Daha az göster',
    back: 'Menüye dön',
    favourites: 'Sevilenler',
    seeFavourites: 'Sevilenleri gör',
    productCount: (n) => `${n} ürün`,
    searchResults: (n) => `${n} sonuç`,
    emptyCategory: 'Bu kategoride süzgeçlere uyan ürün yok.',
    details: (name) => `${name} ayrıntıları`,
    page: (n) => `${n}. sayfa`,
    priceNote: 'Fiyatlara KDV dahildir.',
  },
  en: {
    search: 'Search the menu',
    searchPlaceholder: 'What would you like to eat?',
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
    callNotePlaceholder: 'e.g. could we have two waters?',
    sendCall: 'Send call',
    callPending: 'Your call has been sent, a waiter is on the way.',
    callDone: 'The waiter has completed your call.',
    callAgain: 'Call again',
    scanTableQr: 'To call a waiter or ask for the bill, scan the QR code on your table.',
    requestBill: 'Ask for the bill',
    callTitle: 'How can we help?',
    callWaiterHint: 'Order, water, napkins…',
    requestBillHint: 'A waiter brings the bill to your table',
    billPending: 'Your bill request has been sent, a waiter is on the way.',
    callSent: 'Sent',
    home: 'Menu',
    language: 'Türkçe',
    languageLabel: 'Change language: Türkçe',
    categories: 'Categories',
    allCategories: 'All categories',
    seeAll: 'See all',
    seeLess: 'Show less',
    back: 'Back to menu',
    favourites: 'Favourites',
    seeFavourites: 'See favourites',
    productCount: (n) => `${n} item${n === 1 ? '' : 's'}`,
    searchResults: (n) => `${n} result${n === 1 ? '' : 's'}`,
    emptyCategory: 'Nothing in this category matches your filters.',
    details: (name) => `${name} details`,
    page: (n) => `Page ${n}`,
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
