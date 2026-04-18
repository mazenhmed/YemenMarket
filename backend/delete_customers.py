import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

def delete_all_customers():
    print("Starting deletion of customer accounts...")
    deleted_count, _ = User.objects.filter(role='customer').delete()
    print(f"Successfully deleted {deleted_count} customer accounts.")

if __name__ == "__main__":
    delete_all_customers()
