from django.contrib import admin
from .models import Category, Product, ProductReview, Wishlist

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_ar', 'icon', 'is_active', 'order')
    list_editable = ('order', 'is_active')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'vendor', 'price', 'stock_quantity', 'status', 'sold_count', 'rating', 'is_featured', 'created_at')
    list_filter = ('status', 'category', 'is_featured', 'vendor')
    search_fields = ('name', 'vendor__store_name')
    actions = ['approve_products', 'suspend_products']

    def approve_products(self, request, queryset):
        queryset.update(status='active')
    approve_products.short_description = "Approve selected products"

    def suspend_products(self, request, queryset):
        queryset.update(status='suspended')
    suspend_products.short_description = "Suspend selected products"

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
