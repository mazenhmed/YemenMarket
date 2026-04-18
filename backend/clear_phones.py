import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from vendors.models import Vendor

def clear_phones():
    print("🛠 Starting to clear phone numbers...")
    
    # Update Users
    users_updated = User.objects.all().update(phone='')
    print(f"✅ Cleared phone numbers for {users_updated} users.")
    
    # Update Vendors
    vendors_updated = Vendor.objects.all().update(phone='')
    print(f"✅ Cleared phone numbers for {vendors_updated} vendors.")
    
    print("✨ Phone numbers cleared successfully.")

if __name__ == "__main__":
    clear_phones()
