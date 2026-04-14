from django.contrib import admin
from .models import Vendor

@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('store_name', 'user', 'status', 'is_verified', 'total_sales', 'commission_rate', 'rating', 'created_at')
    list_filter = ('status', 'is_verified', 'city')
    search_fields = ('store_name', 'user__username', 'phone', 'email')
    actions = ['approve_vendors', 'suspend_vendors']

    def approve_vendors(self, request, queryset):
        queryset.update(status='approved')
    approve_vendors.short_description = "Approve selected vendors"

    def suspend_vendors(self, request, queryset):
        queryset.update(status='suspended')
    suspend_vendors.short_description = "Suspend selected vendors"
