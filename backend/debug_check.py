import os
import sys
import django
from django.conf import settings

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    print("--- 1. Testing Django Setup ---")
    django.setup()
    print("SUCCESS: Django setup completed.\n")

    print("--- 2. Testing URL Configuration ---")
    from django.urls import get_resolver
    resolver = get_resolver()
    # This will trigger a load of all URLs and Views
    resolver.url_patterns
    print("SUCCESS: URL Configuration is clean.\n")

    print("--- 3. Testing Component Imports ---")
    from users import views
    from users import otp_service
    print("SUCCESS: Core components imported successfully.\n")

    print("--- 4. Checking Database for Cache Table ---")
    from django.core.cache import cache
    cache.set('debug_test', 'working', 10)
    val = cache.get('debug_test')
    print(f"SUCCESS: Cache system is {val}.\n")

    print("ALL CHECKS PASSED: The server SHOULD be working.")
    print("If it's not starting, check if another process is using port 8000.")

except Exception as e:
    print("\n!!! ERROR DETECTED !!!")
    import traceback
    traceback.print_exc()
    sys.exit(1)
