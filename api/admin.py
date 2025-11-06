from django.contrib import admin
from .models import Business, Category, Product, WiFiInfo, Comment

class BusinessAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'user', 'menu_type', 'created_at']
    list_filter = ['menu_type', 'created_at']
    search_fields = ['name', 'slug', 'user__username']
    readonly_fields = ['slug', 'created_at', 'updated_at']
    filter_horizontal = []

class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_businesses', 'created_at']
    list_filter = ['businesses', 'created_at']
    search_fields = ['name', 'businesses__name']
    filter_horizontal = ['businesses']  # Çoklu seçim için
    
    def display_businesses(self, obj):
        return ", ".join([business.name for business in obj.businesses.all()])
    display_businesses.short_description = 'İşletmeler'

class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'is_active', 'is_popular', 'created_at']
    list_filter = ['category', 'is_active', 'is_popular', 'created_at']
    search_fields = ['name', 'category__name']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['price', 'is_active', 'is_popular']

class WiFiInfoAdmin(admin.ModelAdmin):
    list_display = ['business', 'ssid', 'is_enabled']
    list_filter = ['is_enabled']
    search_fields = ['business__name', 'ssid']

class CommentAdmin(admin.ModelAdmin):
    list_display = ['user_name', 'business_name', 'rating', 'status', 'created_at', 'short_comment']
    list_filter = ['status', 'rating', 'created_at']
    search_fields = ['user_name', 'business__name', 'comment']
    readonly_fields = ['created_at', 'approved_at']
    list_editable = ['status']
    actions = ['approve_comments', 'reject_comments']
    
    def business_name(self, obj):
        return obj.business.name
    business_name.short_description = 'İşletme'
    
    def short_comment(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    short_comment.short_description = 'Yorum'
    
    def approve_comments(self, request, queryset):
        updated = queryset.update(status='approved')
        self.message_user(request, f"{updated} yorum onaylandı.")
    approve_comments.short_description = "Seçili yorumları onayla"
    
    def reject_comments(self, request, queryset):
        updated = queryset.update(status='rejected')
        self.message_user(request, f"{updated} yorum reddedildi.")
    reject_comments.short_description = "Seçili yorumları reddet"

from .models import WaiterCall

class WaiterCallAdmin(admin.ModelAdmin):
    list_display = ['business', 'table_number', 'location', 'status', 'called_at']
    list_filter = ['status', 'business']
    search_fields = ['table_number', 'location', 'business__name']



# Modelleri admin panele kaydet
admin.site.register(Business, BusinessAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(WiFiInfo, WiFiInfoAdmin)
admin.site.register(Comment, CommentAdmin)
admin.site.register(WaiterCall, WaiterCallAdmin)