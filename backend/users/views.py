import traceback
import logging
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q, Sum, Count
from .models import User
from .serializers import UserSerializer, RegisterSerializer, ProfileUpdateSerializer
from core.permissions import IsAdmin

logger = logging.getLogger(__name__)

# Import our helper service
try:
    from .otp_service import normalize_phone, send_whatsapp_otp, verify_otp
except Exception as e:
    print(f"CRITICAL IMPORT ERROR: {e}")
    normalize_phone = lambda x: x
    send_whatsapp_otp = lambda x: {'success': False, 'message': str(e)}
    verify_otp = lambda x, y: {'valid': False, 'message': str(e)}

def _issue_tokens(user):
    """Helper: issue JWT refresh + access tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id':         user.id,
            'username':   user.username,
            'name':       user.get_full_name() or user.first_name or user.username,
            'first_name': user.first_name,
            'email':      user.email,
            'role':       user.role,
            'phone':      user.phone,
            'city':       user.city,
            'avatar':     user.avatar.url if user.avatar else None,
        }
    }

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

class PhoneLoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    def post(self, request):
        try:
            phone = request.data.get('phone', '').strip()
            password = request.data.get('password', '').strip()
            if not phone or not password:
                return Response({'error': 'يرجى إدخال رقم الجوال وكلمة المرور'}, status=status.HTTP_400_BAD_REQUEST)
            
            normalized = normalize_phone(phone)
            user = None
            if normalized:
                user = User.objects.filter(phone=normalized).first()
            if not user:
                user = User.objects.filter(username=phone).first() or User.objects.filter(username=normalized).first()
            
            # رسالة موحّدة لمنع هجمات تعداد المستخدمين (User Enumeration)
            AUTH_ERROR = 'بيانات الدخول غير صحيحة'
            
            if user is None or not user.check_password(password):
                return Response({'error': AUTH_ERROR}, status=status.HTTP_401_UNAUTHORIZED)
            
            if not user.is_active or not user.is_active_account:
                return Response({'error': 'الحساب موقوف'}, status=status.HTTP_403_FORBIDDEN)
            
            return Response(_issue_tokens(user), status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'PhoneLoginView error: {traceback.format_exc()}')
            return Response({'error': 'حدث خطأ في السيرفر'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SendWhatsAppOTPView(APIView):
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
    permission_classes = (permissions.AllowAny,)
    def post(self, request):
        try:
            name = request.data.get('name', '').strip()
            phone = request.data.get('phone', '').strip()
            password = request.data.get('password', '').strip()
            otp_code = request.data.get('otp_code', '').strip()
            role = request.data.get('role', 'customer')
            
            if not name or not phone or not otp_code:
                return Response({'error': 'يرجى إكمال كافة البيانات'}, status=status.HTTP_400_BAD_REQUEST)
            
            otp_result = verify_otp(phone, otp_code)
            if not otp_result['valid']:
                return Response({'error': otp_result['message']}, status=status.HTTP_401_UNAUTHORIZED)
            
            normalized = normalize_phone(phone)
            if User.objects.filter(phone=normalized).exists():
                return Response({'error': 'رقم الجوال مسجّل مسبقاً'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create_user(
                username=f"user_{normalized}",
                first_name=name,
                password=password,
                phone=normalized,
                role=role
            )
            try:
                from notifications.services import notify_admin_new_user
                notify_admin_new_user(user)
            except Exception:
                pass
            return Response(_issue_tokens(user), status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class LinkPhoneView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request):
        try:
            phone = request.data.get('phone', '').strip()
            otp_code = request.data.get('otp_code', '').strip()
            otp_result = verify_otp(phone, otp_code)
            if not otp_result['valid']:
                return Response({'error': otp_result['message']}, status=status.HTTP_401_UNAUTHORIZED)
            
            normalized = normalize_phone(phone)
            if User.objects.filter(phone=normalized).exclude(id=request.user.id).exists():
                return Response({'error': 'الرقم مستخدم في حساب آخر'}, status=status.HTTP_400_BAD_REQUEST)
            
            u = request.user
            u.phone = normalized
            u.save()
            return Response({'message': 'تم الربط بنجاح'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class FirebaseAuthView(APIView):
    permission_classes = (permissions.AllowAny,)
    def post(self, request):
        return Response({'error': 'Firebase integration is currently disabled in favor of WhatsApp OTP'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_stats(request):
    try:
        from vendors.models import Vendor
        from products.models import Product
        from orders.models import Order
        
        order_stats = Order.objects.aggregate(
            total_orders=Count('id'),
            total_sales=Sum('subtotal'),
            total_commission=Sum('platform_commission'),
            pending_orders=Count('id', filter=Q(status='pending'))
        )
        data = {
            'total_stores': Vendor.objects.count(),
            'total_products': Product.objects.count(),
            'total_orders': order_stats['total_orders'] or 0,
            'total_sales': float(order_stats['total_sales'] or 0),
            'total_commission': float(order_stats['total_commission'] or 0),
            'total_users': User.objects.count(),
            'total_customers': User.objects.filter(role='customer').count(),
            'total_vendors': User.objects.filter(role='vendor').count(),
        }
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_users(request):
    try:
        from django.core.paginator import Paginator
        search = request.query_params.get('search', '')
        role   = request.query_params.get('role', '')
        page   = request.query_params.get('page', 1)
        
        qs = User.objects.all().order_by('-date_joined')
        if search:
            qs = qs.filter(Q(username__icontains=search) | Q(phone__icontains=search))
        if role:
            qs = qs.filter(role=role)
        
        paginator = Paginator(qs, 30)  # 30 مستخدم لكل صفحة
        page_obj = paginator.get_page(page)
        serializer = UserSerializer(page_obj.object_list, many=True)
        return Response({
            'results':  serializer.data,
            'count':    paginator.count,
            'pages':    paginator.num_pages,
            'page':     int(page),
        })
    except Exception as e:
        logger.error(f'admin_users error: {e}')
        return Response({'error': str(e)}, status=500)

@api_view(['DELETE'])
@permission_classes([IsAdmin])
def admin_delete_user(request, user_id):
    try:
        user_to_delete = User.objects.get(id=user_id)
        if user_to_delete.is_superuser:
            return Response({'error': 'لا يمكن حذف مدير النظام الأساسي'}, status=status.HTTP_400_BAD_REQUEST)
        user_to_delete.delete()
        return Response({'message': 'تم حذف المستخدم بنجاح'})
    except User.DoesNotExist:
        return Response({'error': 'المستخدم غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
