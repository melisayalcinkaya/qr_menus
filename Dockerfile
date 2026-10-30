# --- 1. aşama: React uygulamasını derle -------------------------------------
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# --- 2. aşama: Django + gunicorn ---------------------------------------------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FRONTEND_DIST=/app/frontend_dist \
    SQLITE_PATH=/data/db.sqlite3 \
    MEDIA_ROOT=/data/media

# DejaVu: masa kartı PDF'lerinde Türkçe karakterler için
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY backend/ ./
COPY --from=web /web/dist ./frontend_dist

RUN DJANGO_SECRET_KEY=collectstatic-only python manage.py collectstatic --noinput \
    && useradd --create-home --uid 10001 app \
    && mkdir -p /data/media \
    && chown -R app:app /data

# Root olmayan kullanıcıyla çalış
USER app
EXPOSE 8000

# Demo: her açılışta şema güncellenir ve (boşsa) demo verisi yüklenir
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_demo && exec gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --access-logfile - --forwarded-allow-ips='*'"]
