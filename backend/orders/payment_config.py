"""
Payment configuration for YemenMarket platform.
Admin can update these values from the admin dashboard.
"""
from django.db import models
from django.conf import settings


class PaymentAccount(models.Model):
    """Platform payment accounts - managed by admin"""
    PROVIDER_CHOICES = (
        ('transfer', 'تحويل بنكي'),
        ('floosak', 'فلوسك'),
        ('jawali', 'جوالي'),
        ('kuraimi', 'كريمي'),
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, unique=True)
    account_name = models.CharField(max_length=255, help_text="اسم صاحب الحساب")
    account_number = models.CharField(max_length=100, help_text="رقم الحساب أو المحفظة")
    bank_name = models.CharField(max_length=255, blank=True, help_text="اسم البنك (للتحويل البنكي)")
    instructions = models.TextField(blank=True, help_text="تعليمات الدفع للعميل")
    is_active = models.BooleanField(default=True)
    icon = models.CharField(max_length=10, default='💳')
    display_order = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
        null=True, blank=True, related_name='updated_payment_accounts'
    )

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"{self.get_provider_display()} - {self.account_number}"


# Default payment accounts data (used in seed)
DEFAULT_PAYMENT_ACCOUNTS = [
    {
        'provider': 'floosak',
        'account_name': 'YemenMarket',
        'account_number': '777161670',
        'instructions': 'قم بتحويل المبلغ إلى رقم فلوسك أعلاه ثم أدخل رقم عملية التحويل',
        'icon': '📱',
        'display_order': 1,
    },
    {
        'provider': 'jawali',
        'account_name': 'YemenMarket',
        'account_number': '777161670',
        'instructions': 'قم بتحويل المبلغ إلى رقم جوالي أعلاه ثم أدخل رقم عملية التحويل',
        'icon': '📲',
        'display_order': 2,
    },
    {
        'provider': 'kuraimi',
        'account_name': 'YemenMarket',
        'account_number': '777161670',
        'bank_name': 'بنك الكريمي',
        'instructions': 'قم بتحويل المبلغ عبر الكريمي للصرافة إلى الرقم أعلاه ثم أدخل رقم الحوالة',
        'icon': '🏦',
        'display_order': 3,
    },
    {
        'provider': 'transfer',
        'account_name': 'YemenMarket',
        'account_number': '0010-200300-001',
        'bank_name': 'بنك اليمن والخليج',
        'instructions': 'قم بتحويل المبلغ إلى الحساب البنكي أعلاه ثم أدخل رقم الحوالة أو أرفق صورة السند',
        'icon': '🏛️',
        'display_order': 4,
    },
]
