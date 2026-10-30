from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from api.models import Business, Product, Table


class SeedDemoTests(TestCase):
    def test_seed_is_idempotent_and_resettable(self):
        call_command("seed_demo", stdout=StringIO())
        self.assertEqual(Business.objects.count(), 3)
        self.assertEqual(
            set(Business.objects.values_list("theme", flat=True)), {"klasik", "bistro", "vitrin"}
        )
        self.assertTrue(Table.objects.filter(token="demo-bistro-4").exists())
        products = Product.objects.count()

        out = StringIO()
        call_command("seed_demo", stdout=out)
        self.assertIn("zaten var", out.getvalue())
        self.assertEqual(Product.objects.count(), products)

        call_command("seed_demo", "--reset", stdout=StringIO())
        self.assertEqual(Business.objects.count(), 3)

    def test_demo_login_works(self):
        call_command("seed_demo", stdout=StringIO())
        r = self.client.post(
            "/api/auth/login/",
            {"username": "demo", "password": "demo-sifre-2026"},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
