from django.db import models
from django.conf import settings

class Vendor(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vendor_profile')
    store_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_verified = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False, help_text="الاشتراكات المميزة للمتاجر")
    logo = models.ImageField(upload_to='vendors/logos/', blank=True, null=True, help_text="شعار المتجر")
    id_document = models.FileField(upload_to='vendors/documents/', blank=True, null=True, help_text="وثيقة إثبات الهوية أو السجل التجاري")
    admin_notes = models.TextField(blank=True, help_text="ملاحظات الإدارة في حال الرفض أو القبول")
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)  # 5% default
    total_sales = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    total_commission_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.store_name

    @property
    def is_approved(self):
        return self.status == 'approved'
