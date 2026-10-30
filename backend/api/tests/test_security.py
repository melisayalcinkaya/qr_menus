"""İlk değerlendirmede bulunan açıklar için regresyon testleri."""

from api.models import Comment, Product, WaiterCall

from .factories import TwoOwnersTestCase, make_image


class AnonymousAccessTests(TwoOwnersTestCase):
    def test_waiter_calls_are_not_public(self):
        # Eskiden /api/businesses/<slug>/waiter-calls/ herkese masa ve notları gösteriyordu
        WaiterCall.objects.create(business=self.cafe, table_number="5", note="alerjim var")
        self.assertEqual(self.client.get("/api/waiter-calls/").status_code, 401)
        self.assertEqual(self.client.get(f"/api/businesses/{self.cafe.slug}/").status_code, 401)

    def test_management_endpoints_require_auth(self):
        for url in ["/api/businesses/", "/api/categories/", "/api/products/", "/api/comments/"]:
            self.assertEqual(self.client.get(url).status_code, 401, url)

    def test_qr_requires_owner(self):
        self.assertEqual(self.client.get(f"/api/businesses/{self.cafe.slug}/qr/").status_code, 401)
        self.login(self.burak)
        self.assertEqual(self.client.get(f"/api/businesses/{self.cafe.slug}/qr/").status_code, 404)


class TenantIsolationTests(TwoOwnersTestCase):
    """Bir işletme sahibi diğerinin kayıtlarını göremez ve değiştiremez (IDOR)."""

    def setUp(self):
        super().setUp()
        self.login(self.ayse)

    def test_lists_only_own_records(self):
        names = [p["name"] for p in self.client.get("/api/products/").json()["results"]]
        self.assertEqual(names, ["Baklava"])
        slugs = [b["slug"] for b in self.client.get("/api/businesses/").json()["results"]]
        self.assertEqual(slugs, [self.cafe.slug])

    def test_cannot_read_or_edit_foreign_product(self):
        url = f"/api/products/{self.mercimek.id}/"
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.patch(url, {"price": "1"}).status_code, 404)
        self.assertEqual(self.client.delete(url).status_code, 404)

    def test_cannot_move_product_into_foreign_category(self):
        # Eskiden ürün başka işletmenin kategorisine taşınıp onun menüsüne eklenebiliyordu
        r = self.client.patch(
            f"/api/products/{self.baklava.id}/", {"category": self.corba.id}, format="json"
        )
        self.assertEqual(r.status_code, 400)
        self.baklava.refresh_from_db()
        self.assertEqual(self.baklava.category, self.tatli)

    def test_cannot_create_product_in_foreign_category(self):
        # Eskiden ValueError ile 500 hatası dönüyordu
        r = self.client.post(
            "/api/products/", {"category": self.corba.id, "name": "X", "price": "1"}, format="json"
        )
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Product.objects.filter(name="X").exists())

    def test_cannot_create_category_for_foreign_business(self):
        r = self.client.post(
            "/api/categories/", {"business": self.bistro.slug, "name": "Sahte"}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_category_cannot_change_business(self):
        other = self.client.post(
            "/api/businesses/", {"name": "Ayşe İkinci Şube"}, format="json"
        ).json()
        r = self.client.patch(
            f"/api/categories/{self.tatli.id}/", {"business": other["slug"]}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_owner_field_cannot_be_overridden(self):
        r = self.client.post(
            "/api/businesses/", {"name": "Yeni", "owner": self.burak.id}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        self.assertFalse(self.burak.businesses.filter(name="Yeni").exists())

    def test_cannot_review_foreign_comment(self):
        c = Comment.objects.create(business=self.bistro, text="iyi", rating=5)
        self.assertEqual(self.client.post(f"/api/comments/{c.id}/approve/").status_code, 404)
        c.refresh_from_db()
        self.assertEqual(c.status, "pending")

    def test_cannot_close_foreign_waiter_call(self):
        call = WaiterCall.objects.create(business=self.bistro, table_number="3")
        self.assertEqual(
            self.client.post(f"/api/waiter-calls/{call.id}/complete/").status_code, 404
        )

    def test_comment_text_is_read_only_for_owner(self):
        c = Comment.objects.create(business=self.cafe, text="orijinal", rating=2)
        r = self.client.patch(f"/api/comments/{c.id}/", {"text": "harika!"}, format="json")
        self.assertEqual(r.status_code, 405)

    def test_waiter_call_cannot_be_moved(self):
        call = WaiterCall.objects.create(business=self.cafe, table_number="3")
        r = self.client.patch(f"/api/waiter-calls/{call.id}/", {"business": self.bistro.id})
        self.assertEqual(r.status_code, 405)


class PublicMenuPrivacyTests(TwoOwnersTestCase):
    def test_inactive_products_hidden(self):
        Product.objects.create(category=self.tatli, name="Gizli", price=1, is_active=False)
        data = self.client.get(f"/api/public/{self.cafe.slug}/").json()
        names = [p["name"] for c in data["categories"] for p in c["products"]]
        self.assertEqual(names, ["Baklava"])

    def test_menu_does_not_leak_owner_or_other_businesses(self):
        data = self.client.get(f"/api/public/{self.cafe.slug}/").json()
        self.assertNotIn("owner", data)
        self.assertNotIn("Mercimek", str(data))

    def test_wifi_shown_only_when_enabled(self):
        self.cafe.wifi_ssid, self.cafe.wifi_password = "KafeWifi", "sifre123"
        self.cafe.save()
        self.assertIsNone(self.client.get(f"/api/public/{self.cafe.slug}/").json()["wifi"])
        self.cafe.wifi_enabled = True
        self.cafe.save()
        wifi = self.client.get(f"/api/public/{self.cafe.slug}/").json()["wifi"]
        self.assertEqual(wifi, {"ssid": "KafeWifi", "password": "sifre123"})

    def test_public_routes_are_reachable(self):
        # Eskiden comments/public/ router'ın <pk>/ desenine takılıp 404 dönüyordu
        self.assertEqual(
            self.client.get(f"/api/public/{self.cafe.slug}/comments/").status_code, 200
        )
        self.assertEqual(self.client.get("/api/public/olmayan/").status_code, 404)

    def test_only_approved_comments_listed(self):
        Comment.objects.create(business=self.cafe, text="onaylı", rating=5, status="approved")
        Comment.objects.create(business=self.cafe, text="bekleyen", rating=1)
        Comment.objects.create(business=self.bistro, text="başka", rating=5, status="approved")
        data = self.client.get(f"/api/public/{self.cafe.slug}/comments/").json()["results"]
        self.assertEqual([c["text"] for c in data], ["onaylı"])
        self.assertEqual(set(data[0]), {"id", "author_name", "text", "rating", "created_at"})


class PublicInputValidationTests(TwoOwnersTestCase):
    def test_new_comment_is_pending_and_status_cannot_be_forced(self):
        r = self.client.post(
            f"/api/public/{self.cafe.slug}/comments/",
            {"text": "Çok güzel", "rating": 5, "status": "approved"},
            format="json",
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Comment.objects.get().status, "pending")

    def test_rating_must_be_between_1_and_5(self):
        for rating in [0, 6, 999]:
            r = self.client.post(
                f"/api/public/{self.cafe.slug}/comments/", {"text": "abc", "rating": rating}
            )
            self.assertEqual(r.status_code, 400, rating)

    def test_comment_rate_limited(self):
        url = f"/api/public/{self.cafe.slug}/comments/"
        codes = [self.client.post(url, {"text": "spam", "rating": 1}).status_code for _ in range(7)]
        self.assertEqual(codes[:5], [201] * 5)
        self.assertEqual(codes[-1], 429)

    def test_waiter_call_rate_limited(self):
        url = f"/api/public/{self.cafe.slug}/waiter-calls/"
        codes = [self.client.post(url, {"table_number": "4"}).status_code for _ in range(8)]
        self.assertIn(429, codes)

    def test_waiter_call_requires_table(self):
        r = self.client.post(f"/api/public/{self.cafe.slug}/waiter-calls/", {"table_number": " "})
        self.assertEqual(r.status_code, 400)


class UploadValidationTests(TwoOwnersTestCase):
    def setUp(self):
        super().setUp()
        self.login(self.ayse)

    def test_valid_image_accepted(self):
        r = self.client.patch(
            f"/api/products/{self.baklava.id}/", {"image": make_image()}, format="multipart"
        )
        self.assertEqual(r.status_code, 200, r.content)

    def test_fake_image_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        fake = SimpleUploadedFile("x.png", b"<svg onload=alert(1)>", content_type="image/png")
        r = self.client.patch(
            f"/api/products/{self.baklava.id}/", {"image": fake}, format="multipart"
        )
        self.assertEqual(r.status_code, 400)

    def test_gif_rejected(self):
        r = self.client.patch(
            f"/api/products/{self.baklava.id}/",
            {"image": make_image("a.gif", "GIF")},
            format="multipart",
        )
        self.assertEqual(r.status_code, 400)
