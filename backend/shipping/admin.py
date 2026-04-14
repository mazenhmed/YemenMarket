from django.contrib import admin
from .models import ShippingZone, ShipmentTracking


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ('city', 'base_cost', 'per_kg_cost', 'estimated_days_min', 'estimated_days_max', 'free_shipping_threshold', 'is_available')
    list_editable = ('base_cost', 'per_kg_cost', 'free_shipping_threshold', 'is_available')


@admin.register(ShipmentTracking)
class ShipmentTrackingAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'order', 'carrier', 'status', 'current_location', 'estimated_delivery', 'updated_at')
    list_filter = ('status', 'carrier')
    search_fields = ('tracking_number', 'order__order_number')
