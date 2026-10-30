# QR Menü

[![CI](https://github.com/melisayalcinkaya/qr_menus/actions/workflows/ci.yml/badge.svg)](https://github.com/melisayalcinkaya/qr_menus/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-yellow.svg)](LICENSE)

Restoran ve kafeler için QR kodlu dijital menü. Müşteri masadaki kodu okutur; menüyü kendi dilinde görür, alerjenlere göre süzer ve tek dokunuşla garson çağırır. İşletme sahibi menüsünü, masalarını, gelen çağrıları ve yorumları tek bir panelden yönetir.

**Canlı demo:** <!-- CANLI-DEMO --> Render kurulumundan sonra eklenecek.
Panel için demo hesabı: `demo` / `demo-sifre-2026`. Tüm demo verileri kurgusaldır.

![Aynı menünün üç teması: Klasik, Bistro ve Vitrin](docs/screenshots/menu-temalar.png)

## Çözdüğü sorun

Basılı menüler güncellenemez, alerjen bilgisi taşımaz ve yabancı misafire hitap etmez. Garsona ulaşmak için el kaldırıp beklemek gerekir. Bu proje:

- Menüyü **masaya özel** bir QR koduyla açar; hangi masadan çağrı geldiği otomatik bilinir.
- Ürünü panelden pasifleştirmek onu **anında** menüden kaldırır; yeniden basım gerekmez.
- 14 yasal alerjen grubunu standart kodlarla tutar ve müşterinin menüyü **süzmesini** sağlar.
- İşletmeye ziyaret, yoğun saat ve garson yanıt süresi gibi **ölçülebilir** veriler verir.

## Özellikler

**Müşteri menüsü** (uygulama indirmeden, telefon tarayıcısında)
- Üç tema, tek kod: Klasik (İznik çinisi), Bistro (kara tahta), Vitrin (pastane camekânı); açık/koyu mod
- Türkçe ve İngilizce; telefonun diline göre açılır, İngilizce alan boşsa Türkçeye düşer
- Türkçe harflere duyarsız arama ("manti" → Mantı), alerjen ve vegan/vejetaryen/acılı süzgeci
- Masa QR'ıyla açıldığında garson çağırma ve çağrının canlı durumu
- Wi-Fi bilgisi (kopyala düğmesiyle) ve işletme onayından geçen yorumlar

**İşletme paneli**
- Canlı garson çağrısı panosu: 5 saniyede bir yenilenir, isteğe bağlı zil sesi, sekme başlığında bekleyen sayısı
- Menü düzenleyici: kategoriler (ikonlu), ürünler, iki dilde içerik, alerjenler, görsel, sıralama, tek tıkla gizleme
- Masalar: tekli/toplu ekleme, QR önizleme ve indirme, sızan bir QR'ı geçersiz kılmak için yeni kod üretme, **tüm masa kartları tek PDF**
- Yorum moderasyonu, kaydetmeden önce canlı tema önizlemesi
- İstatistikler: günlük ziyaret, saatlere göre çağrı, ortalama yanıt süresi, puan dağılımı

**Geliştirici tarafı**
- OpenAPI şeması ve Swagger arayüzü: `/api/docs/`
- 66 backend + 16 frontend testi, %90 kapsam alt sınırı, uçtan uca duman testi yapan CI
- Tek Docker imajı; Render'a tek tıkla kurulum (`render.yaml`)

| Masa QR'ıyla menü: süzgeç ve garson çağırma | Basılabilir masa kartları (PDF) |
|---|---|
| ![Süzgeç ve garson çağırma](docs/screenshots/menu-suzgec-ve-cagri.png) | ![Masa kartları](docs/screenshots/masa-kartlari.png) |

![Panelde genel bakış](docs/screenshots/panel-genel-bakis.png)

<details>
<summary>Diğer panel ekranları</summary>

![Garson çağrıları](docs/screenshots/panel-cagrilar.png)
![Menü düzenleyici](docs/screenshots/panel-menu.png)
![Ürün düzenleme](docs/screenshots/panel-urun-duzenle.png)
![Masalar ve QR kodlar](docs/screenshots/panel-masalar.png)
![Ayarlar ve tema önizlemesi](docs/screenshots/panel-ayarlar.png)

</details>

## Mimari

```mermaid
flowchart LR
    subgraph Tarayici[Tarayıcı]
        M["Müşteri menüsü<br/>/m/slug?masa=belirteç"]
        P["İşletme paneli<br/>/panel"]
    end
    subgraph Sunucu["Tek Docker konteyneri"]
        W["WhiteNoise<br/>derlenmiş React"]
        A["Django REST Framework<br/>/api"]
        D[("SQLite / PostgreSQL")]
    end
    M -- "herkese açık uç noktalar<br/>/api/public/" --> A
    P -- "JWT erişim belirteci<br/>+ HttpOnly yenileme çerezi" --> A
    W --> Tarayici
    A --> D
```

- **backend/**: Django 5.2, DRF, SimpleJWT, drf-spectacular, ReportLab (PDF), qrcode
- **frontend/**: React 19, React Router 7, Vite; UI kütüphanesi yok, sade CSS ve tema değişkenleri
- Yönetim uç noktaları (`/api/businesses/`, `/api/products/` …) yalnızca sahibine açık; müşteri uç noktaları ayrı bir önek altında (`/api/public/<slug>/`)

## Güvenlik

Projenin ilk sürümünde bulunan açıklar düzeltildi ve her biri için regresyon testi yazıldı (`backend/api/tests/test_security.py`).

| Önceki durum | Şimdi |
|---|---|
| Herkes, her işletmenin garson çağrılarını (masa, not) listeleyebiliyordu | Varsayılan izin `IsAuthenticated`; her sorgu sahibine göre süzülüyor, başkasının kaydı 404 |
| Bir işletme sahibi ürününü rakibin kategorisine taşıyıp onun menüsüne ekleyebiliyordu (IDOR) | İlişkili alanlar yalnızca kullanıcının kendi kayıtlarını kabul ediyor; kategori tek işletmeye ait |
| Herkese açık yorum listesi yorumcuların e-postalarını döndürüyordu | E-posta alanı tamamen kaldırıldı (veri minimizasyonu); müşteriye ayrı, dar serializer |
| "1" şifresiyle kayıt olunabiliyordu, hız sınırı yoktu | Django şifre kuralları, benzersiz e-posta; giriş, yorum ve çağrı için hız sınırı |
| JWT'ler `localStorage`'daydı | Erişim belirteci yalnızca bellekte (15 dk); yenileme belirteci `HttpOnly`, `SameSite=Strict` çerezde, rotasyon ve çıkışta kara liste |
| Gizli anahtar repoda, `DEBUG=True`, her kökene CORS izni | Ayarlar ortam değişkenlerinde; production'da HSTS, güvenli çerezler, CSP ve diğer başlıklar |
| Repoda veritabanı, `venv/` ve yüklenen dosyalar (376 MB) | Geçmişten temizlendi (348 KB) |
| Görsel olarak her dosya kabul ediliyordu | İçeriğe bakılarak yalnızca JPEG/PNG/WEBP, en fazla 2 MB |

Diğer önlemler:
- Masa belirteçleri tahmin edilemez; başka işletmenin belirteci geçmez.
- Aynı masadan tekrar basılan "Garson çağır" yeni çağrı açmaz (idempotent, `select_for_update`).
- Yorumlar onaylanmadan yayımlanmaz ve işletme sahibi yorum metnini değiştiremez.
- Konteyner root olmayan bir kullanıcıyla çalışır.

## Kurulum

Gereksinimler: Python 3.12+, Node.js 22+.

```bash
git clone https://github.com/melisayalcinkaya/qr_menus.git
cd qr_menus
cp .env.example .env            # DJANGO_DEBUG=true ile geliştirme anahtarı otomatik kullanılır

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py seed_demo      # demo hesabı ve üç örnek işletme
python manage.py runserver

# Frontend (ayrı bir terminalde)
cd frontend
npm install
npm run dev                     # http://localhost:5173 (/api istekleri Django'ya yönlendirilir)
```

Demo menüler: `/m/cinaralti-lokantasi`, `/m/liman-bistro`, `/m/fistik-pastanesi`. Garson çağırmayı denemek için sonuna `?masa=demo-klasik-4` (ya da `demo-bistro-4`, `demo-vitrin-4`) ekleyin.

### Docker

```bash
docker build -t qr-menu .
docker run -p 8000:8000 -e DJANGO_SECRET_KEY=degistirin -e DJANGO_ALLOWED_HOSTS=localhost \
  -e SECURE_SSL_REDIRECT=false qr-menu
```

### Render'a yayınlama

Depodaki `render.yaml` bir Blueprint tanımıdır: Render panelinde **New → Blueprint** ile bu depoyu seçmeniz yeterli. Gizli anahtar otomatik üretilir, alan adı ve QR adresleri Render'ın verdiği adresten alınır.

## Testler

```bash
cd backend && python manage.py test api        # 66 test
cd frontend && npm test                        # 16 test
```

CI her push'ta şunları çalıştırır: Ruff, eksik migration kontrolü, testler (kapsam %90 altına düşerse başarısız), demo verisi yükleme, ESLint, Vitest, Vite derlemesi. Son olarak Docker imajını production ayarlarıyla başlatıp sayfaların, kimlik doğrulamanın ve güvenlik başlıklarının çalıştığını kontrol eder.

## Bilinen sınırlamalar

- Ücretsiz Render planında disk kalıcı değildir; demo her açılışta sıfırdan yüklenir ve yüklenen görseller yeniden başlatmada kaybolur. Gerçek kullanımda PostgreSQL ve nesne depolama (S3 vb.) gerekir.
- Ücretsiz sunucu bir süre istek gelmezse uykuya geçer; ilk açılış 30–60 saniye sürebilir.
- Canlı çağrı panosu 5 saniyelik yoklamayla (polling) çalışır. Çok sayıda işletmede Server-Sent Events ya da WebSocket (Django Channels + Redis) daha verimli olur.
- Masa belirteci QR'ı fotoğraflayan birinin masaya gelmeden çağrı göndermesini engellemez; bu durumda panelden yeni kod üretilebilir.

## Proje yapısı

```
backend/
  config/            ayarlar, URL'ler, güvenlik başlıkları, SPA sunumu
  api/
    models.py        Business, Category, Product, Table, WaiterCall, Comment, MenuVisit
    views.py         sahip ve herkese açık uç noktalar
    auth_views.py    JWT + HttpOnly yenileme çerezi
    qr.py            QR ve masa kartı PDF'i
    stats.py         panel istatistikleri
    catalog.py       alerjenler, beslenme etiketleri, kategori ikonları
    tests/           güvenlik, yetki, akış, dağıtım testleri
frontend/src/
  lib/               API istemcisi, oturum, süzgeç, biçimlendirme
  menu/              müşteri menüsü ve üç tema
  panel/             işletme paneli
```

## English summary

QR Menu is a digital restaurant menu opened from a per-table QR code. Guests read the menu in Turkish or English, filter it by the 14 legally required allergen groups, and call a waiter with one tap; the owner sees calls live on a dashboard with an optional chime. Owners manage categories, products, tables (with printable PDF table cards), reviews and a theme with live preview, and get statistics such as average waiter response time.

Built with Django REST Framework and React. The first version had several access-control flaws (anonymous access to waiter calls, cross-tenant product moves, leaked reviewer e-mails, tokens in localStorage); all are fixed and covered by regression tests. Other highlights: OpenAPI docs, CSP and security headers, HttpOnly refresh-token rotation, a single Docker image, and CI that boots the image and smoke-tests it.

## Lisans

[MIT](LICENSE)
