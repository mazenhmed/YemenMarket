from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order, Transaction
from .serializers import OrderSerializer, OrderCreateSerializer, TransactionSerializer, PaymentAccountSerializer
from .payment_config import PaymentAccount
from core.permissions import IsAdmin, IsAdminOrVendor
from django.utils import timezone


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # تحسين الأداء: prefetch_related لتجنب N+1 queries عند جلب العناصر
        base_qs = Order.objects.select_related('user').prefetch_related(
            'items', 'items__vendor', 'items__product'
        )
        if user.role == 'admin':
            return base_qs.all()
        if user.role == 'vendor':
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=user)
                return base_qs.filter(items__vendor=vendor).distinct()
            except Vendor.DoesNotExist:
                return Order.objects.none()
        return base_qs.filter(user=user)

    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        order = serializer.save(user=self.request.user)
        try:
            from notifications.services import notify_order_created
            notify_order_created(order)
        except Exception:
            pass

    @action(detail=True, methods=['patch'], url_path='update-status',
            permission_classes=[IsAdminOrVendor])  # إضافة صلاحية — فقط admin و vendor
    def update_status(self, request, pk=None):
        """Update order status (admin/vendor only)."""
        order = self.get_object()
        new_status = request.data.get('status')
        user = request.user
        
        # الـ vendor لا يستطيع تغيير حالة طلب ليس له
        if user.role == 'vendor':
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=user)
                if not order.items.filter(vendor=vendor).exists():
                    return Response({'error': 'لا تملك صلاحية تعديل هذا الطلب'}, status=status.HTTP_403_FORBIDDEN)
                # الـ vendor يستطيع فقط تحديث ل processing و shipped
                if new_status not in ('processing', 'shipped'):
                    return Response({'error': 'غير مصرح لك بتغيير الحالة لهذه القيمة'}, status=status.HTTP_403_FORBIDDEN)
            except Vendor.DoesNotExist:
                return Response({'error': 'لا يوجد متجر مرتبط بحسابك'}, status=status.HTTP_403_FORBIDDEN)
        
        valid = dict(Order.STATUS_CHOICES).keys()
        if new_status not in valid:
            return Response({'error': 'حالة غير صالحة'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])
        try:
            from notifications.services import notify_order_status_changed
            notify_order_status_changed(order)
        except Exception:
            pass
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['patch'], url_path='confirm-payment', permission_classes=[IsAdmin])
    def confirm_payment(self, request, pk=None):
        """Admin confirms payment received for an order."""
        order = self.get_object()
        order.payment_confirmed = True
        order.payment_confirmed_at = timezone.now()
        order.is_paid = True
        order.save(update_fields=['payment_confirmed', 'payment_confirmed_at', 'is_paid'])
        try:
            from notifications.services import notify_payment_confirmed
            notify_payment_confirmed(order)
        except Exception:
            pass
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='validate-coupon', permission_classes=[permissions.AllowAny])
    def validate_coupon(self, request):
        code = request.query_params.get('code')
        if not code:
            return Response({'error': 'رمز الكوبون مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from .models import Coupon
            coupon = Coupon.objects.get(code=code)
            if coupon.is_valid():
                return Response({'discount_percentage': coupon.discount_percentage, 'code': coupon.code})
            return Response({'error': 'الكوبون منتهي الصلاحية أو غير فعال'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'كوبون غير صحيح'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='invoice')
    def invoice(self, request, pk=None):
        """Get invoice data for an order."""
        order = self.get_object()
        serializer = OrderSerializer(order)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAdmin]
    queryset = Transaction.objects.all().order_by('-created_at')


class PaymentAccountViewSet(viewsets.ModelViewSet):
    """Payment accounts management - public read, admin write."""
    serializer_class = PaymentAccountSerializer
    queryset = PaymentAccount.objects.filter(is_active=True)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)
