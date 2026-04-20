from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'city', 'address', 'is_active_account', 'date_joined', 'avatar')


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'phone', 'city')
        # تم حذف 'role' من الحقول — أي مستخدم كان يستطيع التسجيل بـ role='admin' مباشرة!
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role='customer',   # دائماً customer — الترقية يتم يدوياً من اللوحة
            phone=validated_data.get('phone', ''),
            city=validated_data.get('city', ''),
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT login that returns user data along with tokens."""
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
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
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name', 'email', 'phone', 'city', 'address', 'avatar')
