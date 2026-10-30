from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .spa import spa_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/", include("api.urls")),
]

if settings.SERVE_MEDIA:
    urlpatterns.append(
        re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT})
    )

# Geri kalan her yol React uygulamasına (istemci tarafı yönlendirme)
urlpatterns.append(re_path(r"^(?!api/|admin/|media/|static/).*$", spa_index, name="spa"))
