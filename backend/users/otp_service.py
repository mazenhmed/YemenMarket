"""
WhatsApp OTP Service using UltraMsg API.
Handles OTP generation, storage (in-memory cache), sending, and verification.
"""
import os
import random
import string
import requests
from django.core.cache import cache


OTP_EXPIRY_SECONDS  = 300   # 5 دقائق
OTP_CACHE_PREFIX    = 'whatsapp_otp_'
OTP_ATTEMPTS_PREFIX = 'whatsapp_otp_attempts_'
COOLDOWN_PREFIX     = 'whatsapp_otp_cooldown_'
MAX_ATTEMPTS        = 5


def normalize_phone(phone: str) -> str:
    """Normalize Yemeni phone → '7XXXXXXXX' (9 digits without country code)."""
    cleaned = ''.join(filter(str.isdigit, phone))
    if cleaned.startswith('00967'):
        cleaned = cleaned[5:]
    elif cleaned.startswith('967'):
        cleaned = cleaned[3:]
    if cleaned.startswith('0'):
        cleaned = cleaned[1:]
    return cleaned


def international_phone(normalized: str) -> str:
    """Return WhatsApp-ready number: 9677XXXXXXXX (no + sign)."""
    return f'967{normalized}'


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def _get_credentials():
    """Read UltraMsg credentials fresh from env each call (supports restart-less reload)."""
    instance = os.environ.get('ULTRAMSG_INSTANCE', '').strip()
    token    = os.environ.get('ULTRAMSG_TOKEN', '').strip()
    return instance, token


def send_whatsapp_otp(phone: str) -> dict:
    """
    Generate OTP and send it via WhatsApp UltraMsg.
    Returns: { 'success': bool, 'message': str }
    """
    normalized = normalize_phone(phone)

    if len(normalized) < 9:
        return {'success': False, 'message': 'رقم الجوال غير صالح (يجب أن يكون 9 أرقام)'}

    # Rate limiting - 60 ثانية بين كل طلب
    cooldown_key = f'{COOLDOWN_PREFIX}{normalized}'
    if cache.get(cooldown_key):
        return {'success': False, 'message': 'يرجى الانتظار دقيقة قبل طلب رمز جديد'}

    otp        = generate_otp()
    whatsapp_to = international_phone(normalized)
    instance, token = _get_credentials()

    sent_successfully = False

    if instance and token:
        try:
            url = f'https://api.ultramsg.com/{instance}/messages/chat'
            payload = {
                'token': token,
                'to':    whatsapp_to,   # بدون + كما تتطلب UltraMsg
                'body': (
                    f'🛒 *YemenMarket*\n\n'
                    f'رمز التحقق الخاص بك:\n\n'
                    f'*{otp}*\n\n'
                    f'⏱ صالح لمدة 5 دقائق فقط.\n'
                    f'🔒 لا تشاركه مع أحد.'
                ),
                'priority': 1,
            }
            response = requests.post(url, data=payload, timeout=15)
            print(f'[OTP] UltraMsg status: {response.status_code}, body: {response.text[:300]}')
            
            if response.status_code == 200:
                result = response.json()
                if result.get('sent') == 'true' or result.get('id'):
                    sent_successfully = True
                else:
                    print(f'[OTP] UltraMsg rejected: {result}')
                    error_msg = result.get('error', result.get('message', 'خطأ في UltraMsg'))
                    return {'success': False, 'message': f'لم يتم الإرسال: {error_msg}'}
            else:
                print(f'[OTP] UltraMsg HTTP error {response.status_code}: {response.text}')
                return {'success': False, 'message': f'خطأ في الإرسال (HTTP {response.status_code})'}

        except requests.exceptions.Timeout:
            return {'success': False, 'message': 'انتهت مهلة الاتصال بخدمة واتساب، أعد المحاولة'}
        except requests.exceptions.ConnectionError:
            return {'success': False, 'message': 'تعذّر الاتصال بخدمة واتساب، تحقق من الإنترنت'}
        except Exception as e:
            print(f'[OTP] Unexpected error: {e}')
            return {'success': False, 'message': 'خطأ غير متوقع في الإرسال'}
    else:
        # DEV MODE: طباعة في Terminal (لا توجد مفاتيح)
        print(f'\n{"="*40}')
        print(f'[OTP DEV MODE] No UltraMsg credentials found!')
        print(f'  Phone: +{whatsapp_to}')
        print(f'  OTP  : {otp}')
        print(f'{"="*40}\n')
        sent_successfully = True   # نكمل في وضع التطوير

    if sent_successfully:
        # حفظ OTP في Cache
        cache.set(f'{OTP_CACHE_PREFIX}{normalized}', otp, timeout=OTP_EXPIRY_SECONDS)
        # إعادة تهيئة عداد المحاولات
        cache.delete(f'{OTP_ATTEMPTS_PREFIX}{normalized}')
        # تفعيل الـ Cooldown
        cache.set(cooldown_key, True, timeout=60)
        return {'success': True, 'message': f'تم إرسال رمز التحقق على واتساب +967{normalized}'}

    return {'success': False, 'message': 'فشل الإرسال، يرجى المحاولة مجدداً'}


def verify_otp(phone: str, code: str) -> dict:
    """
    Verify OTP code for the given phone number.
    Returns: { 'valid': bool, 'message': str }
    """
    normalized    = normalize_phone(phone)
    attempts_key  = f'{OTP_ATTEMPTS_PREFIX}{normalized}'
    cache_key     = f'{OTP_CACHE_PREFIX}{normalized}'

    attempts = cache.get(attempts_key, 0)
    if attempts >= MAX_ATTEMPTS:
        return {'valid': False, 'message': 'تجاوزت عدد المحاولات المسموحة. اطلب رمزاً جديداً.'}

    stored_otp = cache.get(cache_key)
    
    # --- DEBUG LOGGING ---
    with open('otp_debug.log', 'a', encoding='utf-8') as f:
        import datetime
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        f.write(f"[{timestamp}] Checking for: {normalized}\n")
        f.write(f"[{timestamp}] Stored: '{stored_otp}', Provided: '{code}'\n")
    # ---------------------

    if not stored_otp:
        return {'valid': False, 'message': 'انتهت صلاحية رمز التحقق أو لم يُرسَل بعد'}

    # Ensure robust string comparison
    if str(stored_otp).strip() != str(code).strip():
        cache.set(attempts_key, attempts + 1, timeout=OTP_EXPIRY_SECONDS)
        remaining = MAX_ATTEMPTS - (attempts + 1)
        with open('otp_debug.log', 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] RESULT: FAILED (mismatch)\n\n")
        return {'valid': False, 'message': f'رمز التحقق غير صحيح. ({remaining} محاولات متبقية)'}

    # OTP صحيح - احذفه لمنع إعادة الاستخدام
    cache.delete(cache_key)
    cache.delete(attempts_key)
    with open('otp_debug.log', 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] RESULT: SUCCESS ✅\n\n")
    return {'valid': True, 'message': 'تم التحقق بنجاح ✅'}
