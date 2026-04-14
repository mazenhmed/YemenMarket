from django.contrib import admin
from .models import Order, OrderItem, Transaction, Coupon
from .payment_config import PaymentAccount


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'full_name', 'city', 'total_price', 'payment_method', 'payment_confirmed', 'status', 'created_at')
    list_filter = ('status', 'payment_method', 'payment_confirmed', 'is_paid', 'city', 'created_at')
    search_fields = ('order_number', 'full_name', 'phone', 'wallet_transaction_id', 'transfer_number')
    readonly_fields = ('order_number', 'subtotal', 'total_price', 'platform_commission', 'discount_amount')
    inlines = [OrderItemInline]
    actions = ['confirm_payment', 'mark_delivered']

    def confirm_payment(self, request, queryset):
        from django.utils import timezone
        queryset.update(payment_confirmed=True, payment_confirmed_at=timezone.now(), is_paid=True)
    confirm_payment.short_description = "تأكيد استلام الدفع"

    def mark_delivered(self, request, queryset):
        queryset.update(status='delivered')
    mark_delivered.short_description = "تعليم كـ تم التوصيل"


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage', 'is_active', 'valid_from', 'valid_to')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('order', 'vendor', 'transaction_type', 'amount', 'commission', 'vendor_amount', 'created_at')
    list_filter = ('transaction_type', 'created_at')


@admin.register(PaymentAccount)
class PaymentAccountAdmin(admin.ModelAdmin):
    list_display = ('provider', 'account_name', 'account_number', 'bank_name', 'is_active', 'display_order')
    list_filter = ('provider', 'is_active')
    list_editable = ('is_active', 'display_order')
