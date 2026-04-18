import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from vendors.models import Vendor

print("\n" + "="*60)
print(f"{'Username':<15} | {'Role':<10} | {'Phone':<12} | {'Verified'}")
print("-" * 60)

users = User.objects.all().order_by('role')
for u in users:
    phone = u.phone if u.phone else "None"
    status = "Yes" if u.phone else "No"
    print(f"{u.username:<15} | {u.role:<10} | {phone:<12} | {status}")

print("="*60 + "\n")

print("Vendor Details:")
vendors = Vendor.objects.all()
for v in vendors:
    print(f"Store: {v.store_name} | Owner: {v.user.username} | Phone: {v.phone}")
print("="*60 + "\n")
