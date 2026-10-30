from io import StringIO

from django.core.management import call_command
from django.test import TestCase


class ApiDocsTests(TestCase):
    def test_schema_has_no_warnings(self):
        # Uyarı varsa komut hata verir; dokümantasyonun kodla uyumlu kaldığını garanti eder
        call_command("spectacular", "--validate", "--fail-on-warn", stdout=StringIO())

    def test_docs_pages(self):
        self.assertEqual(self.client.get("/api/docs/").status_code, 200)
        schema = self.client.get("/api/schema/")
        self.assertEqual(schema.status_code, 200)
        self.assertIn(b"/api/public/{slug}/waiter-calls/", schema.content)
