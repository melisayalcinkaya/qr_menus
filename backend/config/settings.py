"""
QR Menü projesinin Django ayarları.

Gizli ya da ortama göre değişen her değer ortam değişkenlerinden okunur.
Yerelde `.env` dosyası kullanılabilir (bkz. `.env.example`).
"""

import mimetypes
import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Yerel geliştirmede .env dosyasını yükle (production'da değişkenler platformdan gelir)
try:
    from dotenv import load_dotenv

    load_dotenv(BASE_DIR.parent / ".env")
except ImportError:  # pragma: no cover
    pass


def env_bool(name, default=False):
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [item.strip() for item in os.environ.get(name, default).split(",") if item.strip()]


DEBUG = env_bool("DJANGO_DEBUG", False)

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if DEBUG:
        # Sadece geliştirme için; production'da anahtar yoksa uygulama açılmaz
        SECRET_KEY = "dev-only-insecure-key-do-not-use-in-production"
    else:
        from django.core.exceptions import ImproperlyConfigured

        raise ImproperlyConfigured("DJANGO_SECRET_KEY ortam değişkeni tanımlanmalı.")

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")
# Render gibi platformlar kendi alan adını bu değişkenle verir
RENDER_HOST = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "config.middleware.SecurityHeadersMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# Sadece izin verilen ön yüz adresleri API'ye tarayıcıdan erişebilir
CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.environ.get("SQLITE_PATH", BASE_DIR / "db.sqlite3"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "tr"
TIME_ZONE = "Europe/Istanbul"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# Derlenmiş React uygulaması (Docker imajında /app/frontend_dist)
FRONTEND_DIST = Path(os.environ.get("FRONTEND_DIST", BASE_DIR.parent / "frontend" / "dist"))
WHITENOISE_ROOT = FRONTEND_DIST if FRONTEND_DIST.exists() else None
# Vite dosya adlarına içerik özeti ekler (index-3fa2c1.js); bunlar sonsuza dek önbelleklenebilir
WHITENOISE_IMMUTABLE_FILE_TEST = r"^.+[.-][0-9a-zA-Z_-]{8,12}\..+$"
# Manifest dosyası yoksa (testler, geliştirme) hata vermek yerine özgün adı kullan
WHITENOISE_MANIFEST_STRICT = False

# Python 3.12'nin yerleşik tablosunda .webp yok ve slim Docker imajında /etc/mime.types
# bulunmuyor; tür kaydedilmezse görseller application/octet-stream olarak gider ve
# X-Content-Type-Options: nosniff ile tarayıcı tarafından engellenebilir.
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", BASE_DIR / "media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Varsayılan kapalı: herkese açık uç noktalar bunu açıkça AllowAny ile ezer
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_THROTTLE_RATES": {
        "auth": os.environ.get("THROTTLE_AUTH", "10/min"),
        "public_comment": os.environ.get("THROTTLE_PUBLIC_COMMENT", "5/hour"),
        "public_waiter_call": os.environ.get("THROTTLE_PUBLIC_WAITER_CALL", "6/hour"),
    },
    # Ters vekil (Render vb.) arkasında istemci IP'si X-Forwarded-For'un
    # sağdan N'inci değeridir; soldaki değerleri istemci uydurabilir.
    "NUM_PROXIES": int(os.environ.get("NUM_PROXIES", "0")) or None,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "QR Menü API",
    "DESCRIPTION": (
        "İşletme sahipleri için yönetim uç noktaları (JWT) ve müşteri menüsü için "
        "herkese açık uç noktalar (/api/public/)."
    ),
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "ENUM_NAME_OVERRIDES": {
        "CommentStatusEnum": "api.models.Comment.STATUS_CHOICES",
        "WaiterCallStatusEnum": "api.models.WaiterCall.STATUS_CHOICES",
    },
}

# Müşteri menüsünün yayınlandığı adres; QR kodları bu adrese yönlendirir
PUBLIC_MENU_BASE_URL = (
    os.environ.get("PUBLIC_MENU_BASE_URL")
    or os.environ.get("RENDER_EXTERNAL_URL")
    or "http://localhost:5173"
).rstrip("/")

# Yüklenen görselleri Django'nun sunması (tek sunuculu demo için; büyük ölçekte
# nesne depolama + CDN kullanılmalı)
SERVE_MEDIA = env_bool("SERVE_MEDIA", DEBUG)

CORS_ALLOW_CREDENTIALS = True  # yenileme çerezi için

# Yüklemeler için üst sınır (görseller ayrıca 2 MB ile sınırlı)
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

# --- Production güvenlik ayarları ---------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"
    # Paneldeki tema önizlemesi menüyü aynı kökenden iframe ile gösterir
    X_FRAME_OPTIONS = "SAMEORIGIN"
    CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")
    if os.environ.get("RENDER_EXTERNAL_URL"):
        CSRF_TRUSTED_ORIGINS.append(os.environ["RENDER_EXTERNAL_URL"])

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.environ.get("LOG_LEVEL", "INFO")},
}
