"""
WhatsApp OTP Service using UltraMsg API.
Handles OTP generation, storage (Database Cache), sending, and verification.
"""
import os
import random
import string
import requests
import datetime
from django.core.cache import cache

# Configuration Constants
OTP_EXPIRY_SECONDS  = 300   # 5 minutes
OTP_CACHE_PREFIX    = 'whatsapp_otp_'
OTP_ATTEMPTS_PREFIX = 'whatsapp_otp_attempts_'
COOLDOWN_PREFIX     = 'whatsapp_otp_cooldown_'
MAX_ATTEMPTS        = 5

def normalize_phone(phone: str) -> str:
    """Normalize Yemeni phone → '7XXXXXXXX' (9 digits)."""
    if not phone:
        return ""
    cleaned = ''.join(filter(str.isdigit, str(phone)))
    if cleaned.startswith('00967'):
        cleaned = cleaned[5:]
    elif cleaned.startswith('967'):
        cleaned = cleaned[3:]
    if cleaned.startswith('0'):
        cleaned = cleaned[1:]
    return cleaned

def international_phone(normalized: str) -> str:
    """Return WhatsApp-ready number: 9677XXXXXXXX."""
    return f'967{normalized}'

def generate_otp(length: int = 6) -> str:
    """Generate a random 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=length))

def _get_credentials():
    """Freshly read UltraMsg credentials from env."""
    instance = os.environ.get('ULTRAMSG_INSTANCE', '').strip()
    token    = os.environ.get('ULTRAMSG_TOKEN', '').strip()
    return instance, token

def send_whatsapp_otp(phone: str) -> dict:
    """Generate OTP and send it via WhatsApp."""
    normalized = normalize_phone(phone)
    if len(normalized) < 9:
        return {'success': False, 'message': 'رقم الجوال غير صالح'}

    # Rate limiting
    cooldown_key = f'{COOLDOWN_PREFIX}{normalized}'
    if cache.get(cooldown_key):
        return {'success': False, 'message': 'يرجى الانتظار دقيقة قبل طلب رمز جديد'}

    otp = generate_otp()
    whatsapp_to = international_phone(normalized)
    instance, token = _get_credentials()

    sent_successfully = False
    if instance and token:
        try:
            url = f'https://api.ultramsg.com/{instance}/messages/chat'
            payload = {
                'token': token,
                'to': whatsapp_to,
                'body': f'🛒 *YemenMarket*\n\nرمز التحقق الخاص بك:\n\n*{otp}*\n\n⏱ صالح لـ 5 دقائق.',
                'priority': 1,
            }
            response = requests.post(url, data=payload, timeout=15)
            if response.status_code == 200:
                result = response.json()
                if result.get('sent') == 'true' or result.get('id'):
                    sent_successfully = True
        except Exception as e:
            print(f"[OTP ERROR] {e}")
    else:
        # DEV MODE
        print(f"\n[OTP DEV] Phone: {whatsapp_to} | Code: {otp}\n")
        sent_successfully = True

    if sent_successfully:
        cache.set(f'{OTP_CACHE_PREFIX}{normalized}', otp, timeout=OTP_EXPIRY_SECONDS)
        cache.delete(f'{OTP_ATTEMPTS_PREFIX}{normalized}')
        cache.set(cooldown_key, True, timeout=60)
        return {'success': True, 'message': f'تم إرسال رمز التحقق إلى +967{normalized}'}

    return {'success': False, 'message': 'فشل الإرسال، حاول مجدداً'}

def verify_otp(phone: str, code: str) -> dict:
    """Verify OTP code for the given phone number."""
    normalized = normalize_phone(phone)
    attempts_key = f'{OTP_ATTEMPTS_PREFIX}{normalized}'
    cache_key = f'{OTP_CACHE_PREFIX}{normalized}'

    attempts = cache.get(attempts_key, 0)
    if attempts >= MAX_ATTEMPTS:
        return {'valid': False, 'message': 'تجاوزت عدد المحاولات المسموحة'}

    stored_otp = cache.get(cache_key)
    
    # --- DEBUGGING OUTPUT ---
    now = datetime.datetime.now().strftime('%H:%M:%S')
    print(f"[{now}] OTP Check: {normalized} | Stored: {stored_otp} | Given: {code}")

    if not stored_otp:
        return {'valid': False, 'message': 'انتهت صلاحية رمز التحقق'}

    if str(stored_otp).strip() != str(code).strip():
        cache.set(attempts_key, attempts + 1, timeout=OTP_EXPIRY_SECONDS)
        remaining = MAX_ATTEMPTS - (attempts + 1)
        return {'valid': False, 'message': f'رمز التحقق غير صحيح ({remaining} محاولات متبقية)'}

    # Success
    cache.delete(cache_key)
    cache.delete(attempts_key)
    return {'valid': True, 'message': 'تم التحقق بنجاح ✅'}
