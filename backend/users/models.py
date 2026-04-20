from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('vendor', 'Vendor'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='customer', db_index=True)
    phone = models.CharField(max_length=20, blank=True, db_index=True)  # فهرسة لتسريع البحث بالهاتف
    city = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='users/avatars/', blank=True, null=True)
    is_active_account = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['phone'], name='user_phone_idx'),
            models.Index(fields=['role'], name='user_role_idx'),
            models.Index(fields=['role', '-date_joined'], name='user_role_joined_idx'),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
