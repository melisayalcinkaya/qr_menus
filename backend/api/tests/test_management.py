from api.models import Comment, WaiterCall

from .factories import TwoOwnersTestCase


class OwnerFlowTests(TwoOwnersTestCase):
    def setUp(self):
        super().setUp()
        self.login(self.ayse)

    def test_create_business_generates_unique_slug(self):
        a = self.client.post("/api/businesses/", {"name": "Ayşe Kafe"}, format="json").json()
        self.assertEqual(a["slug"], "ayse-kafe-2")
        self.assertTrue(a["menu_url"].endswith("/m/ayse-kafe-2"))

    def test_product_crud_with_lists(self):
        r = self.client.post(
            "/api/products/",
            {
                "category": self.tatli.id,
                "name": "Künefe",
                "price": "150.00",
                "allergens": ["milk", "gluten"],
                "ingredients": ["kadayıf", "peynir"],
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["allergens"], ["milk", "gluten"])

    def test_multipart_lists_accept_json_strings(self):
        r = self.client.post(
            "/api/products/",
            {"category": self.tatli.id, "name": "Sütlaç", "price": "90", "allergens": '["milk"]'},
            format="multipart",
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["allergens"], ["milk"])

    def test_negative_price_rejected(self):
        r = self.client.post(
            "/api/products/", {"category": self.tatli.id, "name": "X", "price": "-5"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_comment_moderation(self):
        c = Comment.objects.create(business=self.cafe, text="Lezzetli", rating=5)
        r = self.client.post(f"/api/comments/{c.id}/approve/")
        self.assertEqual(r.json()["status"], "approved")
        self.assertEqual(
            len(self.client.get(f"/api/public/{self.cafe.slug}/comments/").json()["results"]), 1
        )

    def test_waiter_call_lifecycle(self):
        call = WaiterCall.objects.create(business=self.cafe, table_label="7")
        pending = self.client.get("/api/waiter-calls/?status=pending").json()["results"]
        self.assertEqual(len(pending), 1)
        self.assertEqual(
            self.client.post(f"/api/waiter-calls/{call.id}/complete/").status_code, 200
        )
        self.assertEqual(self.client.post(f"/api/waiter-calls/{call.id}/cancel/").status_code, 409)

    def test_qr_png(self):
        r = self.client.get(f"/api/businesses/{self.cafe.slug}/qr/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "image/png")
        self.assertTrue(r.content.startswith(b"\x89PNG"))


class CatalogAndStatsTests(TwoOwnersTestCase):
    def setUp(self):
        super().setUp()
        self.login(self.ayse)

    def test_unknown_allergen_code_rejected(self):
        r = self.client.patch(
            f"/api/products/{self.baklava.id}/", {"allergens": ["kedi"]}, format="json"
        )
        self.assertEqual(r.status_code, 400)
        r = self.client.patch(
            f"/api/products/{self.baklava.id}/",
            {"allergens": ["nuts", "nuts", "gluten"], "dietary": ["vegetarian"]},
            format="json",
        )
        self.assertEqual(r.json()["allergens"], ["nuts", "gluten"])

    def test_meta_lists_14_allergens(self):
        self.client.force_authenticate(None)
        data = self.client.get("/api/meta/").json()
        self.assertEqual(len(data["allergens"]), 14)
        self.assertIn({"code": "vegan", "tr": "Vegan", "en": "Vegan"}, data["dietary"])

    def test_english_fields_in_public_menu(self):
        self.baklava.name_en = "Baklava with pistachio"
        self.baklava.save()
        data = self.client.get(f"/api/public/{self.cafe.slug}/").json()
        self.assertEqual(data["categories"][0]["products"][0]["name_en"], "Baklava with pistachio")

    def test_stats(self):
        from django.utils import timezone

        from api.models import Comment, Table, WaiterCall

        self.client.get(f"/api/public/{self.cafe.slug}/")
        self.client.get(f"/api/public/{self.cafe.slug}/")
        self.client.get(f"/api/public/{self.cafe.slug}/?preview=1")  # sayılmaz
        Comment.objects.create(business=self.cafe, text="a", rating=4, status="approved")
        Comment.objects.create(business=self.cafe, text="b", rating=2, status="approved")
        Table.objects.create(business=self.cafe, label="1")
        call = WaiterCall.objects.create(business=self.cafe, table_label="1", status="completed")
        WaiterCall.objects.filter(pk=call.pk).update(
            completed_at=call.created_at + timezone.timedelta(seconds=90)
        )

        data = self.client.get(f"/api/businesses/{self.cafe.slug}/stats/?days=7").json()
        self.assertEqual(data["visits"]["total"], 2)
        self.assertEqual(len(data["visits"]["series"]), 7)
        self.assertEqual(data["comments"]["avg_rating"], 3.0)
        self.assertEqual(data["waiter_calls"]["avg_response_seconds"], 90)
        self.assertEqual(sum(h["count"] for h in data["waiter_calls"]["by_hour"]), 1)
        self.assertEqual(data["menu"], {"categories": 1, "products": 1, "tables": 1})

    def test_stats_owner_only(self):
        r = self.client.get(f"/api/businesses/{self.bistro.slug}/stats/")
        self.assertEqual(r.status_code, 404)


class SlugTests(TwoOwnersTestCase):
    def test_turkish_letters_transliterated(self):
        from api.models import Business

        b = Business.objects.create(owner=self.ayse, name="Çınaraltı Şöbiyet Ğİ")
        self.assertEqual(b.slug, "cinaralti-sobiyet-gi")
