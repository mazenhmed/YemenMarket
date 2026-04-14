from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ('order_new', 'طلب جديد'),
        ('order_status', 'تحديث حالة طلب'),
        ('order_paid', 'تأكيد دفع'),
        ('product_approved', 'قبول منتج'),
        ('product_rejected', 'رفض منتج'),
        ('store_approved', 'قبول متجر'),
        ('store_suspended', 'إيقاف متجر'),
        ('welcome', 'ترحيب'),
        ('system', 'إشعار نظام'),
        ('low_stock', 'نفاد مخزون'),
        ('new_review', 'تقييم جديد'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='system')
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=500, blank=True, help_text="رابط الإجراء")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.user.username}"
