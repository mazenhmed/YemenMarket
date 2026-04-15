#!/usr/bin/env bash
# إيقاف التثبيت إذا حدث خطأ
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py shell -c "from users.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@yemenmarket.com', 'admin123')"
