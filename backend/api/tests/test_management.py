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
                "allergens": ["süt", "gluten"],
                "ingredients": ["kadayıf", "peynir"],
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["allergens"], ["süt", "gluten"])

    def test_multipart_lists_accept_json_strings(self):
        r = self.client.post(
            "/api/products/",
            {"category": self.tatli.id, "name": "Sütlaç", "price": "90", "allergens": '["süt"]'},
            format="multipart",
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()["allergens"], ["süt"])

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
