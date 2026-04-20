from django.db import models
from django.conf import settings
from products.models import Product
import uuid
from django.utils import timezone
from decimal import Decimal


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.PositiveIntegerField(default=10, help_text="نسبة الخصم المئوية")
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(blank=True, null=True)

    def is_valid(self):
        now = timezone.now()
        if not self.is_active: return False
        if self.valid_from and now < self.valid_from: return False
        if self.valid_to and now > self.valid_to: return False
        return True

    def __str__(self):
        return self.code


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('returned', 'Returned'),
    )
    PAYMENT_CHOICES = (
        ('cash', 'الدفع عند الاستلام'),
        ('transfer', 'تحويل بنكي'),
        ('floosak', 'فلوسك'),
        ('jawali', 'جوالي'),
        ('kuraimi', 'كريمي'),
        ('credit_card', 'بطاقة ائتمان'),
    )
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    address = models.TextField()
    notes = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    coupon_code = models.CharField(max_length=50, blank=True, help_text="كود الخصم المستخدم")
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="قيمة الخصم")
    platform_commission = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash')
    transfer_number = models.CharField(max_length=100, blank=True, help_text="رقم الحوالة أو سند الدفع")
    receipt_image = models.ImageField(upload_to='orders/receipts/', blank=True, null=True, help_text="صورة سند الحوالة")
    wallet_number = models.CharField(max_length=50, blank=True, help_text="رقم المحفظة المرسل منها")
    wallet_transaction_id = models.CharField(max_length=100, blank=True, help_text="رقم عملية التحويل من المحفظة")
    card_last_four = models.CharField(max_length=4, blank=True, help_text="آخر 4 أرقام من البطاقة")
    payment_reference = models.CharField(max_length=100, blank=True, help_text="مرجع الدفع الموحد")
    payment_confirmed = models.BooleanField(default=False, help_text="تأكيد استلام الدفع من الإدارة")
    payment_confirmed_at = models.DateTimeField(blank=True, null=True)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_number} by {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate unique order number using timestamp + short uuid
            now = timezone.now()
            short_id = uuid.uuid4().hex[:5].upper()
            self.order_number = f"YM-{now.strftime('%y%m%d')}-{short_id}"
        # عمولة ثابتة 5% — للطلب ككل (تُحسب لكل vendor في Transaction)
        self.platform_commission = self.subtotal * Decimal('5') / Decimal('100')
        self.total_price = max(self.subtotal - self.discount_amount, Decimal('0.00')) + self.shipping_cost
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)
    product_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    def save(self, *args, **kwargs):
        self.total = self.product_price * self.quantity
        super().save(*args, **kwargs)


class Transaction(models.Model):
    """Tracks financial transactions: payments to vendors, platform commissions"""
    TYPE_CHOICES = (
        ('sale', 'Sale Commission'),
        ('payout', 'Vendor Payout'),
        ('refund', 'Refund'),
    )
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    vendor = models.ForeignKey('vendors.Vendor', on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='sale')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    commission = models.DecimalField(max_digits=12, decimal_places=2)
    vendor_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.order.order_number}"

    def save(self, *args, **kwargs):
        self.commission = self.amount * Decimal('5') / Decimal('100')
        self.vendor_amount = self.amount - self.commission
        super().save(*args, **kwargs)
