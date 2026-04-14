#!/usr/bin/env bash
# إيقاف التثبيت إذا حدث خطأ
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
