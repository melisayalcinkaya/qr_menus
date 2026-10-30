from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify

from .validators import validate_image_file


def logo_upload_path(instance, filename):
    return f"logos/{instance.slug}/{filename}"


def category_upload_path(instance, filename):
    return f"categories/{instance.business.slug}/{filename}"


def product_upload_path(instance, filename):
    return f"products/{instance.category.business.slug}/{filename}"


class Business(models.Model):
    """Menüsü yayınlanan işletme. Her işletmenin tek bir sahibi vardır."""

    THEME_CHOICES = [
        ("klasik", "Klasik"),
        ("bistro", "Bistro"),
        ("vitrin", "Vitrin"),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="businesses"
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=110, unique=True, blank=True)
    logo = models.ImageField(
        upload_to=logo_upload_path, null=True, blank=True, validators=[validate_image_file]
    )
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default="klasik")

    # Müşterinin menüde göreceği Wi-Fi bilgisi (isteğe bağlı)
    wifi_ssid = models.CharField(max_length=64, blank=True)
    wifi_password = models.CharField(max_length=64, blank=True)
    wifi_enabled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "İşletme"
        verbose_name_plural = "İşletmeler"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name, allow_unicode=False) or "isletme"
            slug, i = base, 2
            while Business.objects.filter(slug=slug).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Category(models.Model):
    """Menü kategorisi. Yalnızca tek bir işletmeye aittir."""

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    image = models.ImageField(
        upload_to=category_upload_path, null=True, blank=True, validators=[validate_image_file]
    )
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]
        verbose_name = "Kategori"
        verbose_name_plural = "Kategoriler"

    def __str__(self):
        return f"{self.business} / {self.name}"


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    image = models.ImageField(
        upload_to=product_upload_path, null=True, blank=True, validators=[validate_image_file]
    )
    is_active = models.BooleanField(default=True, help_text="Pasif ürünler menüde görünmez.")
    is_popular = models.BooleanField(default=False)
    preparation_time = models.PositiveIntegerField(default=0, help_text="Dakika")
    ingredients = models.JSONField(default=list, blank=True)
    allergens = models.JSONField(default=list, blank=True)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "id"]
        verbose_name = "Ürün"
        verbose_name_plural = "Ürünler"

    def __str__(self):
        return self.name

    @property
    def business(self):
        return self.category.business


class Comment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Beklemede"),
        ("approved", "Onaylandı"),
        ("rejected", "Reddedildi"),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="comments")
    author_name = models.CharField(max_length=60, blank=True)
    text = models.TextField(max_length=1000)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["business", "status"])]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=1, rating__lte=5), name="comment_rating_1_5"
            )
        ]
        verbose_name = "Yorum"
        verbose_name_plural = "Yorumlar"

    def __str__(self):
        return f"{self.business} - {self.rating}/5"


class WaiterCall(models.Model):
    STATUS_CHOICES = [
        ("pending", "Bekliyor"),
        ("completed", "Tamamlandı"),
        ("cancelled", "İptal edildi"),
    ]

    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="waiter_calls")
    table_number = models.CharField(max_length=10)
    note = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["business", "status"])]
        verbose_name = "Garson çağrısı"
        verbose_name_plural = "Garson çağrıları"

    def __str__(self):
        return f"{self.business} - Masa {self.table_number}"
