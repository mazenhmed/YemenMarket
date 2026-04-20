import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from users.models import User
from rest_framework.test import APIClient

client = APIClient()
admin_user, _ = User.objects.get_or_create(username='testadmin', email='testadmin@yemenmarket.com', role='admin')
admin_user.is_superuser = True
admin_user.save()

client.force_authenticate(user=admin_user)

endpoints = [
    '/api/users/admin/stats/',
    '/api/users/admin/users/',
    '/api/vendors/stores/',
    '/api/products/items/',
    '/api/orders/checkout/',
    '/api/orders/transactions/',
    '/api/products/categories/',
]

print("Testing API Endpoints as Admin:")
for url in endpoints:
    response = client.get(url)
    status_emoji = 'OK' if response.status_code == 200 else 'FAIL'
    print(f"[{status_emoji}] {url} -> {response.status_code}")
    if response.status_code != 200:
        print(f"    Error: {response.data}")

print("\nAll tests completed successfully!")
