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

python manage.py shell -c "from users.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@yemenmarket.com', 'admin123')"
