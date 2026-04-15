#!/usr/bin/env bash
# إيقاف التثبيت إذا حدث خطأ
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [ -f "datadump.json" ]; then
    echo "Migrating old data to PostgreSQL..."
    python manage.py loaddata datadump.json
fi

# Run the massive AI seed data script if not already run
python manage.py shell -c "from vendors.models import Vendor; import os; os.system('python manage.py shell < seed_massive.py') if not Vendor.objects.filter(store_name='مركز الخليج التجاري').exists() else print('Massive seed already run.')"

# Ensure admin has correct role
python manage.py shell -c "from users.models import User; u, _ = User.objects.get_or_create(username='admin', defaults={'email': 'admin@yemenmarket.com'}); u.set_password('admin123'); u.is_staff=True; u.is_superuser=True; u.role='admin'; u.save()"
