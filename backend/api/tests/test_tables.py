from api.models import Table, WaiterCall

from .factories import TwoOwnersTestCase


class TableManagementTests(TwoOwnersTestCase):
    def setUp(self):
        super().setUp()
        self.login(self.ayse)

    def create(self, label):
        return self.client.post(
            "/api/tables/", {"business": self.cafe.slug, "label": label}, format="json"
        )

    def test_create_table_with_menu_url(self):
        r = self.create(" Bahçe 2 ")
        self.assertEqual(r.status_code, 201, r.content)
        data = r.json()
        self.assertEqual(data["label"], "Bahçe 2")
        self.assertTrue(data["menu_url"].endswith(f"/m/{self.cafe.slug}?masa={data['token']}"))

    def test_duplicate_label_rejected(self):
        self.create("5")
        self.assertEqual(self.create("5").status_code, 400)
        # Başka işletmede aynı ad serbest
        Table.objects.create(business=self.bistro, label="7")
        self.assertEqual(self.create("7").status_code, 201)

    def test_regenerate_token_invalidates_old_qr(self):
        table = Table.objects.create(business=self.cafe, label="3")
        old = table.token
        new = self.client.post(f"/api/tables/{table.id}/regenerate-token/").json()["token"]
        self.assertNotEqual(old, new)
        url = f"/api/public/{self.cafe.slug}/waiter-calls/"
        self.assertEqual(self.client.post(url, {"table": old}).status_code, 400)
        self.assertEqual(self.client.post(url, {"table": new}).status_code, 201)

    def test_table_qr_and_pdf(self):
        r = self.client.get(f"/api/businesses/{self.cafe.slug}/table-cards/")
        self.assertEqual(r.status_code, 400)  # henüz masa yok
        for i in range(1, 8):  # 7 masa -> 2 sayfa
            Table.objects.create(business=self.cafe, label=str(i))
        table = Table.objects.filter(business=self.cafe).first()
        r = self.client.get(f"/api/tables/{table.id}/qr/")
        self.assertTrue(r.content.startswith(b"\x89PNG"))
        r = self.client.get(f"/api/businesses/{self.cafe.slug}/table-cards/")
        self.assertEqual(r["Content-Type"], "application/pdf")
        self.assertTrue(r.content.startswith(b"%PDF"))
        self.assertIn(b"/Count 2", r.content)


class CustomerCallTests(TwoOwnersTestCase):
    def setUp(self):
        super().setUp()
        self.table = Table.objects.create(business=self.cafe, label="12")
        self.url = f"/api/public/{self.cafe.slug}/waiter-calls/"

    def test_menu_opened_from_table_qr(self):
        data = self.client.get(f"/api/public/{self.cafe.slug}/?masa={self.table.token}").json()
        self.assertEqual(data["table"], {"label": "12", "token": self.table.token})
        bad = self.client.get(f"/api/public/{self.cafe.slug}/?masa=yanlis").json()
        self.assertIsNone(bad["table"])

    def test_call_copies_label_and_is_idempotent(self):
        r1 = self.client.post(self.url, {"table": self.table.token, "note": "Hesap lütfen"})
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r1.json()["table_label"], "12")
        r2 = self.client.post(self.url, {"table": self.table.token})
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(r1.json()["id"], r2.json()["id"])
        self.assertEqual(WaiterCall.objects.count(), 1)

    def test_customer_sees_call_status(self):
        status_url = f"/api/public/{self.cafe.slug}/tables/{self.table.token}/call/"
        self.assertEqual(self.client.get(status_url).status_code, 404)
        call_id = self.client.post(self.url, {"table": self.table.token}).json()["id"]
        self.assertEqual(self.client.get(status_url).json()["status"], "pending")
        WaiterCall.objects.filter(id=call_id).update(status="completed")
        self.assertEqual(self.client.get(status_url).json()["status"], "completed")
        # Yeni çağrı açılabilir
        self.assertEqual(self.client.post(self.url, {"table": self.table.token}).status_code, 201)

    def test_deleted_table_keeps_call_history(self):
        self.client.post(self.url, {"table": self.table.token})
        self.table.delete()
        call = WaiterCall.objects.get()
        self.assertIsNone(call.table)
        self.assertEqual(call.table_label, "12")
