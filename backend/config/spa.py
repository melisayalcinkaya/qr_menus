"""Derlenmiş React uygulamasını (Vite çıktısı) Django üzerinden sunar.

/assets/* gibi dosyaları WhiteNoise doğrudan verir; bunun dışındaki her istemci
rotası (/m/<slug>, /panel/...) index.html'e düşer ve yönlendirmeyi React yapar.
"""

from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.cache import never_cache


@never_cache
def spa_index(request):
    index = Path(settings.FRONTEND_DIST) / "index.html"
    if not index.exists():
        return HttpResponse(
            "Ön yüz derlenmemiş. Geliştirmede `cd frontend && npm run dev` kullanın.",
            status=503,
            content_type="text/plain; charset=utf-8",
        )
    return HttpResponse(index.read_bytes(), content_type="text/html; charset=utf-8")
