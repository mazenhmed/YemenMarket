from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User
from .serializers import UserSerializer, RegisterSerializer, ProfileUpdateSerializer
from core.permissions import IsAdmin
from .otp_service import send_whatsapp_otp, verify_otp, normalize_phone


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer


def _issue_tokens(user):
    """Helper: issue JWT refresh + access tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
            'role':     user.role,
            'phone':    user.phone,
            'city':     user.city,
        }
    }


class PhoneLoginView(APIView):
    """
    POST /api/users/phone-login/
    Login with phone number OR username + password.
    Body: { phone, password }  (phone can be a phone number or username)
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        phone    = request.data.get('phone', '').strip()
        password = request.data.get('password', '').strip()

        if not phone or not password:
            return Response({'error': 'يرجى إدخال رقم الجوال وكلمة المرور'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Normalize phone: remove +967 prefix
        normalized = phone.replace('+967', '').replace('+', '').strip().lstrip('0')

        # Try to find user by phone first, then by username
        user = (
            User.objects.filter(phone=normalized).first() or
            User.objects.filter(username=phone).first() or
            User.objects.filter(username=normalized).first()
        )

        if user is None:
            return Response({'error': 'رقم الجوال أو اسم المستخدم غير مسجّل'},
                            status=status.HTTP_401_UNAUTHORIZED)

        # Verify password
        if not user.check_password(password):
            return Response({'error': 'كلمة المرور غير صحيحة'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active or not user.is_active_account:
            return Response({'error': 'الحساب موقوف'}, status=status.HTTP_403_FORBIDDEN)

        return Response(_issue_tokens(user), status=status.HTTP_200_OK)


class SendWhatsAppOTPView(APIView):
    """
    POST /api/users/send-otp/
    Send a WhatsApp OTP to the given phone number.
    Body: { phone }
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        if not phone:
            return Response({'error': 'يرجى إدخال رقم الجوال'}, status=status.HTTP_400_BAD_REQUEST)

        result = send_whatsapp_otp(phone)
        if result['success']:
            return Response({'message': result['message']}, status=status.HTTP_200_OK)
        return Response({'error': result['message']}, status=status.HTTP_429_TOO_MANY_REQUESTS)


class PhoneRegisterView(APIView):
    """
    POST /api/users/phone-register/
    Register with name + phone + password + OTP code (WhatsApp verified).
    Body: { name, phone, password, otp_code, role }
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        name     = request.data.get('name', '').strip()
        phone    = request.data.get('phone', '').strip()
        password = request.data.get('password', '').strip()
        otp_code = request.data.get('otp_code', '').strip()
        role     = request.data.get('role', 'customer')

        if not name:
            return Response({'error': 'يرجى إدخال الاسم'}, status=status.HTTP_400_BAD_REQUEST)
        if not phone:
            return Response({'error': 'يرجى إدخال رقم الجوال'}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 6:
            return Response({'error': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'}, status=status.HTTP_400_BAD_REQUEST)
        if not otp_code:
            return Response({'error': 'يرجى إدخال رمز التحقق'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify OTP
        otp_result = verify_otp(phone, otp_code)
        if not otp_result['valid']:
            return Response({'error': otp_result['message']}, status=status.HTTP_401_UNAUTHORIZED)

        normalized = normalize_phone(phone)

        # Check if phone already registered
        if User.objects.filter(phone=normalized).exists():
            return Response({'error': 'رقم الجوال مسجّل مسبقاً'}, status=status.HTTP_400_BAD_REQUEST)

        # Build unique username from phone
        username = f'user_{normalized}'
        if User.objects.filter(username=username).exists():
            import uuid
            username = f'user_{normalized}_{uuid.uuid4().hex[:4]}'

        # Create user
        user = User.objects.create_user(
            username=username,
            first_name=name,
            email='',
            password=password,
            phone=normalized,
            role=role,
        )

        return Response(_issue_tokens(user), status=status.HTTP_201_CREATED)


class FirebaseAuthView(APIView):
    """
    POST /api/users/firebase-auth/
    Accepts a Firebase ID Token (from phone OTP verification),
    verifies it, creates or fetches the Django user, and returns JWT tokens.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        id_token = request.data.get('id_token', '').strip()
        if not id_token:
            return Response({'error': 'يرجى إرسال Firebase ID Token'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify Firebase token
        try:
            from .firebase_service import verify_firebase_token
            firebase_data = verify_firebase_token(id_token)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        phone = firebase_data.get('phone', '')
        uid   = firebase_data.get('uid', '')
        email = firebase_data.get('email', '')
        name  = firebase_data.get('name', '')

        if not phone and not uid:
            return Response({'error': 'لم يتم العثور على رقم الهاتف في بيانات Firebase'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize phone: +9677XXXXXXX → 77XXXXXXX
        normalized_phone = phone.replace('+967', '').replace('+', '').strip() if phone else ''

        # Find existing user by phone or firebase uid (stored in username as firebase_uid)
        user = None
        if normalized_phone:
            user = User.objects.filter(phone=normalized_phone).first()
        if user is None and uid:
            user = User.objects.filter(username=f'firebase_{uid}').first()

        # Create user if not found
        if user is None:
            # Build a unique username
            username = f'firebase_{uid}'
            display_name = name or (f'مستخدم_{normalized_phone[-4:]}' if normalized_phone else f'مستخدم_{uid[:6]}')

            user = User.objects.create_user(
                username=username,
                email=email or '',
                password=User.objects.make_random_password(),
                phone=normalized_phone,
                role='customer',
            )
            user.first_name = display_name
            user.save(update_fields=['first_name'])

        # Update phone if missing
        if normalized_phone and not user.phone:
            user.phone = normalized_phone
            user.save(update_fields=['phone'])

        # Issue Django JWT tokens
        refresh = RefreshToken.for_user(user)
        access  = refresh.access_token

        return Response({
            'access':  str(access),
            'refresh': str(refresh),
            'user': {
                'id':       user.id,
                'username': user.username,
                'email':    user.email,
                'role':     user.role,
                'phone':    user.phone,
                'city':     user.city,
            },
            'is_new_user': user.date_joined >= user.last_login if user.last_login else True,
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_stats(request):
    """Dashboard stats for admin."""
    from vendors.models import Vendor
    from products.models import Product
    from orders.models import Order
    from django.db.models import Sum, Count, Q as DQ

    order_stats = Order.objects.aggregate(
        total_orders=Count('id'),
        total_sales=Sum('subtotal'),
        total_commission=Sum('platform_commission'),
        pending_orders=Count('id', filter=DQ(status='pending'))
    )

    data = {
        'total_stores': Vendor.objects.count(),
        'active_stores': Vendor.objects.filter(status='approved').count(),
        'total_products': Product.objects.count(),
        'active_products': Product.objects.filter(status='active').count(),
        'pending_products': Product.objects.filter(status='pending').count(),
        'total_orders': order_stats['total_orders'] or 0,
        'total_sales': float(order_stats['total_sales'] or 0),
        'total_commission': float(order_stats['total_commission'] or 0),
        'pending_orders': order_stats['pending_orders'] or 0,
        'total_users': User.objects.count(),
        'total_customers': User.objects.filter(role='customer').count(),
        'total_vendors': User.objects.filter(role='vendor').count(),
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_users(request):
    """List all users for admin."""
    users = User.objects.all().order_by('-date_joined')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)
