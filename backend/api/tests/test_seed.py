import shutil
import tempfile
from io import StringIO

from django.core.management import call_command
from django.test import TestCase, override_settings

from api.models import Business, Product, Table

TEST_MEDIA = tempfile.mkdtemp(prefix="qrmenu-test-media-")


@override_settings(MEDIA_ROOT=TEST_MEDIA)
class SeedDemoTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA, ignore_errors=True)

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

    def test_demo_has_images_and_taglines(self):
        from pathlib import Path

        from api.models import Category

        call_command("seed_demo", stdout=StringIO())
        self.assertFalse(Product.objects.filter(image="").exists())
        self.assertFalse(Category.objects.filter(image="").exists())
        self.assertTrue(Business.objects.get(theme="vitrin").tagline)
        # --reset eski dosyaları siler, klasörde yalnızca güncel görseller kalır
        call_command("seed_demo", "--reset", stdout=StringIO())
        files = list(Path(TEST_MEDIA).rglob("*.webp"))
        self.assertEqual(len(files), Product.objects.count() + Category.objects.count())

    def test_demo_login_works(self):
        call_command("seed_demo", stdout=StringIO())
        r = self.client.post(
            "/api/auth/login/",
            {"username": "demo", "password": "demo-sifre-2026"},
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200)
