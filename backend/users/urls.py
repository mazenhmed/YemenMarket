from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView
from .views import (RegisterView, UserDetailView, admin_stats, admin_users,
                    FirebaseAuthView, PhoneLoginView, PhoneRegisterView,
                    SendWhatsAppOTPView, LinkPhoneView)
from .serializers import CustomTokenObtainPairSerializer


# Custom token view that uses our serializer
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='me'),
    path('phone-login/', PhoneLoginView.as_view(), name='phone-login'),
    path('phone-register/', PhoneRegisterView.as_view(), name='phone-register'),
    path('send-otp/', SendWhatsAppOTPView.as_view(), name='send-whatsapp-otp'),
    path('link-phone/', LinkPhoneView.as_view(), name='link-phone'),
    path('firebase-auth/', FirebaseAuthView.as_view(), name='firebase-auth'),
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('admin/users/', admin_users, name='admin-users'),
]
