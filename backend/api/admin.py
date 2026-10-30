from django.contrib import admin

from .models import Business, Category, Comment, Product, WaiterCall


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "owner", "theme", "created_at"]
    list_filter = ["theme"]
    search_fields = ["name", "slug", "owner__username"]
    readonly_fields = ["slug", "created_at", "updated_at"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "business", "position"]
    list_filter = ["business"]
    search_fields = ["name"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "price", "is_active", "is_popular"]
    list_filter = ["is_active", "is_popular", "category__business"]
    search_fields = ["name"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["business", "author_name", "rating", "status", "created_at"]
    list_filter = ["status", "rating"]


@admin.register(WaiterCall)
class WaiterCallAdmin(admin.ModelAdmin):
    list_display = ["business", "table_number", "status", "created_at"]
    list_filter = ["status"]
