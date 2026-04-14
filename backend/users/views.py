from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, RegisterSerializer, ProfileUpdateSerializer
from core.permissions import IsAdmin


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


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_stats(request):
    """Dashboard stats for admin."""
    from vendors.models import Vendor
    from products.models import Product
    from orders.models import Order
    from django.db.models import Sum, Count

    order_stats = Order.objects.aggregate(
        total_orders=Count('id'),
        total_sales=Sum('subtotal'),
        total_commission=Sum('platform_commission'),
        pending_orders=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='pending'))
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
