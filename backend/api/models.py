# models.py - SON HALİ
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.utils import timezone
import os
from django.db.models import JSONField

def logo_upload_path(instance, filename):
    return f'business_logos/{instance.slug}/{filename}'

def category_image_upload_path(instance, filename):
    base, ext = os.path.splitext(filename)
    return f'category_images/{slugify(instance.name)}/{base}{ext}'

def product_image_upload_path(instance, filename):
    return f'product_images/{slugify(instance.name)}/{filename}'

class Business(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='businesses')
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    logo = models.ImageField(upload_to=logo_upload_path, null=True, blank=True)
    
    MENU_CHOICES = [
        ('menu_1', 'Menü 1'),
        ('menu_2', 'Menü 2'),
        ('menu_3', 'Menü 3'),
    ]
    menu_type = models.CharField(max_length=20, choices=MENU_CHOICES, default='menu_1')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            i = 1
            while Business.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Category(models.Model): 
    businesses = models.ManyToManyField(Business, related_name="categories")
    name = models.CharField(max_length=100)
    banner_image = models.ImageField(upload_to=category_image_upload_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Product(models.Model):
    # Bu model tanımı eksikti, basit bir versiyonunu ekliyorum
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    preparation_time = models.PositiveIntegerField(help_text="Preparation time in minutes", default=0)
    ingredients = models.JSONField(default=list, blank=True)
    allergens = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
class WiFiInfo(models.Model):
    business = models.OneToOneField(
        'Business',
        on_delete=models.CASCADE,
        related_name='wifi_info'
    )
    ssid = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    is_enabled = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.business.name} WiFi Ayarları"
    
class Comment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('approved', 'Onaylandı'),
        ('rejected', 'Reddedildi')
    ]
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='comments')
    user_name = models.CharField(max_length=255, blank=True, null=True)
    user_email = models.EmailField(blank=True, null=True)
    comment = models.TextField()
    rating = models.PositiveSmallIntegerField(default=5)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    approved_by = models.CharField(max_length=255, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['business', 'status']),
        ]

    def __str__(self):
        return f"{self.user_name} - {self.business.name} - {self.rating}/5"
    
# models.py - WaiterCall modeli ekleyin
class WaiterCall(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('completed', 'Tamamlandı'),
        ('cancelled', 'İptal Edildi')
    ]
    
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='waiter_calls')
    table_number = models.CharField(max_length=10)
    location = models.CharField(max_length=100, blank=True, null=True)  # Opsiyonel: bahçe, teras, vs.
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    called_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)  # Ek notlar

    class Meta:
        ordering = ['-called_at']
        indexes = [
            models.Index(fields=['business', 'status']),
            models.Index(fields=['called_at']),
        ]

    def __str__(self):
        return f"{self.business.name} - Masa {self.table_number} - {self.get_status_display()}"