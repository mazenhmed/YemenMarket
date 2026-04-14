from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Vendor, VendorPaymentAccount
from .serializers import VendorSerializer, VendorPaymentAccountSerializer
from core.permissions import IsVendor, IsOwnerOrReadOnly, IsAdmin


class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    search_fields = ['store_name', 'description', 'city']
    ordering_fields = ['created_at', 'rating', 'total_sales']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        if self.action == 'destroy':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Vendor.objects.all()
        # Public only sees approved vendors
        if not self.request.user.is_authenticated or self.request.user.role != 'admin':
            if self.action == 'list':
                qs = qs.filter(status='approved')
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status', permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        vendor = self.get_object()
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', vendor.admin_notes)

        if new_status in dict(Vendor.STATUS_CHOICES):
            vendor.status = new_status
            vendor.admin_notes = admin_notes
            if new_status == 'approved':
                vendor.is_verified = True
            vendor.save()
            try:
                from notifications.services import notify_store_approved, notify_store_suspended
                if new_status == 'approved':
                    notify_store_approved(vendor)
                elif new_status == 'suspended':
                    notify_store_suspended(vendor)
            except Exception:
                pass
            return Response(VendorSerializer(vendor).data)
        return Response({'error': 'حالة غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='pending', permission_classes=[IsAdmin])
    def pending_vendors(self, request):
        qs = Vendor.objects.filter(status='pending')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-store', permission_classes=[permissions.IsAuthenticated])
    def my_store(self, request):
        try:
            vendor = Vendor.objects.get(user=request.user)
            return Response(VendorSerializer(vendor).data)
        except Vendor.DoesNotExist:
            return Response({'error': 'لا يوجد متجر لهذا الحساب'}, status=status.HTTP_404_NOT_FOUND)


class VendorPaymentAccountViewSet(viewsets.ModelViewSet):
    """إدارة حسابات الدفع الخاصة بكل بائع"""
    serializer_class = VendorPaymentAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return VendorPaymentAccount.objects.all()
        try:
            vendor = Vendor.objects.get(user=user)
            return VendorPaymentAccount.objects.filter(vendor=vendor)
        except Vendor.DoesNotExist:
            return VendorPaymentAccount.objects.none()

    def perform_create(self, serializer):
        vendor = Vendor.objects.get(user=self.request.user)
        serializer.save(vendor=vendor)

    @action(detail=False, methods=['get'], url_path='public', permission_classes=[permissions.AllowAny])
    def public_accounts(self, request):
        """عرض حسابات الدفع الخاصة بمتجر معين للعملاء عند الدفع"""
        vendor_id = request.query_params.get('vendor_id')
        if not vendor_id:
            return Response({'error': 'vendor_id مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
        accounts = VendorPaymentAccount.objects.filter(vendor_id=vendor_id, is_active=True)
        return Response(VendorPaymentAccountSerializer(accounts, many=True).data)



class VendorViewSet(viewsets.ModelViewSet):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    search_fields = ['store_name', 'description', 'city']
    ordering_fields = ['created_at', 'rating', 'total_sales']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrReadOnly()]
        if self.action == 'destroy':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Vendor.objects.all()
        # Public only sees approved vendors
        if not self.request.user.is_authenticated or self.request.user.role != 'admin':
            if self.action == 'list':
                qs = qs.filter(status='approved')
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status', permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        vendor = self.get_object()
        new_status = request.data.get('status')
        admin_notes = request.data.get('admin_notes', vendor.admin_notes)

        if new_status in dict(Vendor.STATUS_CHOICES):
            vendor.status = new_status
            vendor.admin_notes = admin_notes
            if new_status == 'approved':
                vendor.is_verified = True
            vendor.save()
            try:
                from notifications.services import notify_store_approved, notify_store_suspended
                if new_status == 'approved':
                    notify_store_approved(vendor)
                elif new_status == 'suspended':
                    notify_store_suspended(vendor)
            except Exception:
                pass
            return Response(VendorSerializer(vendor).data)
        return Response({'error': 'حالة غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='pending', permission_classes=[IsAdmin])
    def pending_vendors(self, request):
        qs = Vendor.objects.filter(status='pending')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-store', permission_classes=[permissions.IsAuthenticated])
    def my_store(self, request):
        try:
            vendor = Vendor.objects.get(user=request.user)
            return Response(VendorSerializer(vendor).data)
        except Vendor.DoesNotExist:
            return Response({'error': 'لا يوجد متجر لهذا الحساب'}, status=status.HTTP_404_NOT_FOUND)
