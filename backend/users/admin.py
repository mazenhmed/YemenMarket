from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'phone', 'city', 'is_active_account', 'date_joined')
    list_filter = ('role', 'is_active_account', 'is_active')
    search_fields = ('username', 'email', 'phone')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('معلومات إضافية', {'fields': ('role', 'phone', 'city', 'address', 'avatar', 'is_active_account')}),
    )
