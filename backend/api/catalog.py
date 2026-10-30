"""Menüde kullanılan sabit listeler (tek doğruluk kaynağı).

Alerjenler, AB 1169/2011 ve Türk Gıda Kodeksi'ndeki 14 zorunlu alerjen grubudur.
Ön yüz bu listeyi /api/meta/ üzerinden alır; kodlar veritabanında saklanır.
"""

ALLERGENS = [
    ("gluten", "Gluten", "Gluten"),
    ("crustaceans", "Kabuklu deniz ürünleri", "Crustaceans"),
    ("eggs", "Yumurta", "Eggs"),
    ("fish", "Balık", "Fish"),
    ("peanuts", "Yer fıstığı", "Peanuts"),
    ("soy", "Soya", "Soy"),
    ("milk", "Süt", "Milk"),
    ("nuts", "Sert kabuklu yemişler", "Tree nuts"),
    ("celery", "Kereviz", "Celery"),
    ("mustard", "Hardal", "Mustard"),
    ("sesame", "Susam", "Sesame"),
    ("sulphites", "Sülfitler", "Sulphites"),
    ("lupin", "Acı bakla", "Lupin"),
    ("molluscs", "Yumuşakçalar", "Molluscs"),
]

DIETARY_TAGS = [
    ("vegetarian", "Vejetaryen", "Vegetarian"),
    ("vegan", "Vegan", "Vegan"),
    ("spicy", "Acılı", "Spicy"),
]

# Kategori ikonları (ön yüzde lucide ikonlarına eşlenir)
CATEGORY_ICONS = [
    ("utensils", "Genel"),
    ("breakfast", "Kahvaltı"),
    ("soup", "Çorba"),
    ("salad", "Salata"),
    ("sandwich", "Sandviç / Tost"),
    ("pizza", "Pizza / Pide"),
    ("meat", "Et"),
    ("chicken", "Tavuk"),
    ("fish", "Balık"),
    ("bakery", "Fırın"),
    ("dessert", "Tatlı"),
    ("icecream", "Dondurma"),
    ("coffee", "Kahve"),
    ("tea", "Çay / Bitki çayı"),
    ("cold_drink", "Soğuk içecek"),
    ("juice", "Meyve suyu"),
    ("wine", "Şarap"),
    ("beer", "Bira"),
]

ALLERGEN_CODES = {code for code, _, _ in ALLERGENS}
DIETARY_CODES = {code for code, _, _ in DIETARY_TAGS}


def as_dicts(items):
    return [{"code": code, "tr": tr, "en": en} for code, tr, en in items]
