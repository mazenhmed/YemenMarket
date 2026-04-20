import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from users.models import User
from rest_framework.test import APIClient
import json

client = APIClient()
admin_user, _ = User.objects.get_or_create(username='testadmin', email='testadmin@yemenmarket.com', role='admin')
admin_user.is_superuser = True
admin_user.save()

client.force_authenticate(user=admin_user)

# Create a dummy user to delete
dummy_user, _ = User.objects.get_or_create(username='dummy_to_delete', email='dummy@yemenmarket.com', role='customer')

url = f"/api/users/admin/users/{dummy_user.id}/"
print(f"Testing DELETE on {url}")

response = client.delete(url)
print(f"Status Code: {response.status_code}")
try:
    print(f"Response Data: {json.dumps(response.data, ensure_ascii=False)}")
except Exception as e:
    print(f"Failed to print data: {e}")

# Check if actually deleted
exists = User.objects.filter(id=dummy_user.id).exists()
print(f"Does dummy user still exist? {exists}")
