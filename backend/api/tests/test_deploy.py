import tempfile
from pathlib import Path

from django.test import TestCase, override_settings


class SpaAndHeadersTests(TestCase):
    def setUp(self):
        self.dist = tempfile.TemporaryDirectory()
        Path(self.dist.name, "index.html").write_text("<!doctype html><div id=root></div>")

    def tearDown(self):
        self.dist.cleanup()

    def test_client_routes_fall_back_to_index(self):
        with override_settings(FRONTEND_DIST=self.dist.name):
            for url in ["/", "/m/cinaralti-lokantasi", "/panel/giris", "/olmayan/sayfa"]:
                r = self.client.get(url)
                self.assertEqual(r.status_code, 200, url)
                self.assertIn(b"id=root", r.content)
                self.assertIn("no-cache", r["Cache-Control"])

    def test_api_routes_are_not_swallowed(self):
        with override_settings(FRONTEND_DIST=self.dist.name):
            self.assertEqual(self.client.get("/api/olmayan/").status_code, 404)
            self.assertEqual(self.client.get("/api/meta/")["Content-Type"], "application/json")

    def test_missing_build_returns_503(self):
        with override_settings(FRONTEND_DIST="/yok"):
            self.assertEqual(self.client.get("/").status_code, 503)

    def test_security_headers(self):
        r = self.client.get("/api/meta/")
        self.assertIn("frame-ancestors 'self'", r["Content-Security-Policy"])
        self.assertIn("script-src 'self'", r["Content-Security-Policy"])
        self.assertEqual(r["X-Content-Type-Options"], "nosniff")
        # Swagger UI CDN'den yüklendiği için CSP'den muaf
        self.assertNotIn("Content-Security-Policy", self.client.get("/api/docs/"))
