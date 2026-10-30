from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

User = get_user_model()


class RegisterTests(APITestCase):
    def setUp(self):
        cache.clear()

    def post(self, **kw):
        data = {
            "username": "melis",
            "email": "m@example.com",
            "password": "Menu-Sifresi-42",
            "password2": "Menu-Sifresi-42",
        } | kw
        return self.client.post("/api/auth/register/", data, format="json")

    def test_register_returns_access_and_sets_httponly_cookie(self):
        r = self.post()
        self.assertEqual(r.status_code, 201)
        self.assertIn("access", r.json())
        self.assertNotIn("refresh", r.json())
        cookie = r.cookies["qrmenu_refresh"]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Strict")

    def test_weak_password_rejected(self):
        # Eskiden "1" şifresi kabul ediliyordu
        r = self.post(password="1", password2="1")
        self.assertEqual(r.status_code, 400)
        self.assertIn("password", r.json())

    def test_password_mismatch(self):
        self.assertEqual(self.post(password2="Baska-Sifre-42").status_code, 400)

    def test_duplicate_email_rejected(self):
        self.post()
        r = self.post(username="baska", email="M@example.com")
        self.assertEqual(r.status_code, 400)
        self.assertIn("email", r.json())


class SessionTests(APITestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user("melis", "m@example.com", "Menu-Sifresi-42")

    def login(self, password="Menu-Sifresi-42"):
        return self.client.post(
            "/api/auth/login/", {"username": "melis", "password": password}, format="json"
        )

    def test_login_refresh_logout_flow(self):
        r = self.login()
        self.assertEqual(r.status_code, 200)
        access = r.json()["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(self.client.get("/api/auth/me/").json()["username"], "melis")

        # Çerezle yenileme; rotasyon sonrası eski çerez geçersiz olur
        old_cookie = self.client.cookies["qrmenu_refresh"].value
        r = self.client.post("/api/auth/refresh/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("access", r.json())
        r = self.client.post("/api/auth/refresh/", {"refresh": old_cookie}, format="json")
        self.assertEqual(r.status_code, 401)

        # Çıkış: çerez silinir ve belirteç kara listeye alınır
        current = self.client.cookies["qrmenu_refresh"].value
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        r = self.client.post("/api/auth/refresh/", {"refresh": current}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_refresh_without_cookie(self):
        self.assertEqual(self.client.post("/api/auth/refresh/").status_code, 401)

    def test_wrong_password(self):
        self.assertEqual(self.login("yanlis").status_code, 401)

    def test_login_rate_limited(self):
        codes = [self.login("yanlis").status_code for _ in range(12)]
        self.assertEqual(codes[-1], 429)
