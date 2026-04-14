from django.db import models
from django.conf import settings
import uuid


class ShippingZone(models.Model):
    """مناطق الشحن مع الأسعار"""
    city = models.CharField(max_length=100, unique=True, help_text="اسم المدينة")
    base_cost = models.DecimalField(max_digits=10, decimal_places=2, help_text="تكلفة الشحن الأساسية بالريال")
    per_kg_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="تكلفة إضافية لكل كيلو")
    estimated_days_min = models.IntegerField(default=1, help_text="أقل عدد أيام للتوصيل")
    estimated_days_max = models.IntegerField(default=3, help_text="أكثر عدد أيام للتوصيل")
    is_available = models.BooleanField(default=True)
    free_shipping_threshold = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="الحد الأدنى للطلب للشحن المجاني (اتركه فارغاً لعدم وجود شحن مجاني)"
    )

    class Meta:
        ordering = ['base_cost']

    def __str__(self):
        return f"{self.city} — {self.base_cost:,.0f} ريال"


class ShipmentTracking(models.Model):
    """تتبع شحنات الطلبات"""
    STATUS_CHOICES = (
        ('preparing', 'قيد التجهيز'),
        ('picked_up', 'تم الاستلام من البائع'),
        ('in_transit', 'في الطريق'),
        ('out_for_delivery', 'خارج للتوصيل'),
        ('delivered', 'تم التوصيل'),
        ('returned', 'مرتجع'),
    )
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='shipment')
    tracking_number = models.CharField(max_length=50, unique=True, editable=False)
    carrier = models.CharField(max_length=100, default='YemenMarket Express', help_text="اسم شركة الشحن")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='preparing')
    current_location = models.CharField(max_length=255, blank=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = f"YM-SH-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tracking_number} — {self.get_status_display()}"


# Default shipping zones data
DEFAULT_SHIPPING_ZONES = [
    {'city': 'صنعاء', 'base_cost': 500, 'per_kg_cost': 200, 'estimated_days_min': 1, 'estimated_days_max': 2, 'free_shipping_threshold': 50000},
    {'city': 'عدن', 'base_cost': 1000, 'per_kg_cost': 300, 'estimated_days_min': 2, 'estimated_days_max': 3, 'free_shipping_threshold': 80000},
    {'city': 'تعز', 'base_cost': 800, 'per_kg_cost': 250, 'estimated_days_min': 2, 'estimated_days_max': 3, 'free_shipping_threshold': 70000},
    {'city': 'إب', 'base_cost': 800, 'per_kg_cost': 250, 'estimated_days_min': 2, 'estimated_days_max': 3, 'free_shipping_threshold': 70000},
    {'city': 'حضرموت', 'base_cost': 1500, 'per_kg_cost': 400, 'estimated_days_min': 3, 'estimated_days_max': 5, 'free_shipping_threshold': 100000},
    {'city': 'الحديدة', 'base_cost': 1000, 'per_kg_cost': 300, 'estimated_days_min': 2, 'estimated_days_max': 4, 'free_shipping_threshold': 80000},
    {'city': 'ذمار', 'base_cost': 700, 'per_kg_cost': 200, 'estimated_days_min': 1, 'estimated_days_max': 2, 'free_shipping_threshold': 60000},
    {'city': 'مأرب', 'base_cost': 600, 'per_kg_cost': 200, 'estimated_days_min': 1, 'estimated_days_max': 2, 'free_shipping_threshold': 60000},
]
