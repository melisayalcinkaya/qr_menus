from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APITestCase

from api.models import Business, Category, Product

User = get_user_model()


def make_image(name="test.png", fmt="PNG", size=(10, 10)):
    buffer = BytesIO()
    Image.new("RGB", size, "orange").save(buffer, format=fmt)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=f"image/{fmt.lower()}")


class TwoOwnersTestCase(APITestCase):
    """İki ayrı işletme sahibi: Ayşe ve Burak. Testler Ayşe'nin Burak'ın verisine
    dokunamadığını doğrular."""

    def setUp(self):
        cache.clear()  # hız sınırı sayaçlarını sıfırla
        self.ayse = User.objects.create_user("ayse", "ayse@example.com", "Guclu-Sifre-2026")
        self.burak = User.objects.create_user("burak", "burak@example.com", "Guclu-Sifre-2026")
        self.cafe = Business.objects.create(owner=self.ayse, name="Ayşe Kafe")
        self.bistro = Business.objects.create(owner=self.burak, name="Burak Bistro")
        self.tatli = Category.objects.create(business=self.cafe, name="Tatlılar")
        self.corba = Category.objects.create(business=self.bistro, name="Çorbalar")
        self.baklava = Product.objects.create(category=self.tatli, name="Baklava", price=120)
        self.mercimek = Product.objects.create(category=self.corba, name="Mercimek", price=80)

    def login(self, user):
        self.client.force_authenticate(user)
