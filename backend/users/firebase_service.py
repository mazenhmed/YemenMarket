"""
Firebase Authentication Service
Verifies Firebase ID tokens from frontend and returns Django JWT tokens.
"""
import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

_firebase_app = None

def get_firebase_app():
    """Initialize Firebase app (singleton)."""
    global _firebase_app
    if _firebase_app is None:
        service_account_path = BASE_DIR / 'firebase-service-account.json'
        if service_account_path.exists():
            cred = credentials.Certificate(str(service_account_path))
        else:
            # Fallback: use environment variables (for production)
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": os.environ.get("FIREBASE_PROJECT_ID", ""),
                "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID", ""),
                "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL", ""),
                "client_id": os.environ.get("FIREBASE_CLIENT_ID", ""),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            })
        _firebase_app = firebase_admin.initialize_app(cred)
    return _firebase_app


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded token data.
    Returns dict with: uid, phone_number, email (if available)
    Raises ValueError if token is invalid.
    """
    get_firebase_app()
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return {
            'uid': decoded.get('uid'),
            'phone': decoded.get('phone_number', ''),
            'email': decoded.get('email', ''),
            'name': decoded.get('name', ''),
        }
    except firebase_auth.ExpiredIdTokenError:
        raise ValueError('انتهت صلاحية رمز التحقق. يرجى إعادة المحاولة.')
    except firebase_auth.InvalidIdTokenError:
        raise ValueError('رمز التحقق غير صالح.')
    except Exception as e:
        raise ValueError(f'فشل التحقق: {str(e)}')
