"""Güvenlik başlıkları."""

# React çıktısı tek kökenden yüklenir; satır içi betik yoktur. Swagger UI ise
# CDN'den yüklendiği için /api/docs/ bu politikadan muaftır (yalnızca JSON şema
# bizim kodumuzdur).
CONTENT_SECURITY_POLICY = "; ".join(
    [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
    ]
)
CSP_EXEMPT_PREFIXES = ("/api/docs/", "/admin/")


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if not request.path.startswith(CSP_EXEMPT_PREFIXES):
            response.setdefault("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        return response
