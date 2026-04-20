from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category, ProductReview, Wishlist
from .serializers import (ProductSerializer, CategorySerializer, ProductReviewSerializer, 
                          ProductCreateSerializer, WishlistSerializer)
from core.permissions import IsAdmin, IsVendorOwner


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    pagination_class = None  # Return all categories without pagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    search_fields = ['name', 'description']
    filterset_fields = ['category', 'vendor', 'status', 'is_featured']
    ordering_fields = ['created_at', 'price', 'sold_count', 'rating']
    ordering = ['-created_at']

    def get_queryset(self):
        # select_related لتجنب N+1 queries للحقول المنتمية للجدول الأخرى
        qs = Product.objects.select_related('category', 'vendor').prefetch_related(
            'gallery_images', 'variants'
        )
        # Public sees only active products
        if self.action == 'list':
            user = self.request.user
            if not user.is_authenticated or user.role == 'customer':
                qs = qs.filter(status='active')
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        
        return qs

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsVendorOwner()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        from .serializers import ProductUpdateSerializer
        if self.action in ['update', 'partial_update']:
            return ProductUpdateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        user = self.request.user
        from vendors.models import Vendor
        try:
            vendor = Vendor.objects.get(user=user)
        except Vendor.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("يجب أن تمتلك متجراً لإضافة منتجات")
        product = serializer.save(vendor=vendor, status='pending')
        try:
            from notifications.services import notify_admin_new_product
            notify_admin_new_product(product)
        except Exception:
            pass

    @action(detail=False, methods=['get'], url_path='featured')
    def featured(self, request):
        """Get featured/best-selling products."""
        products = Product.objects.filter(status='active').select_related(
            'category', 'vendor'
        ).order_by('-sold_count', '-rating')[:12]  # زيادة لـ 12 لعرض أفضل
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='vendor-products')
    def vendor_products(self, request):
        """Get products for the authenticated vendor."""
        if not request.user.is_authenticated:
            return Response([], status=status.HTTP_401_UNAUTHORIZED)
        from vendors.models import Vendor
        try:
            vendor = Vendor.objects.get(user=request.user)
            products = Product.objects.filter(vendor=vendor).select_related(
                'category'
            ).prefetch_related('gallery_images', 'variants').order_by('-created_at')
            serializer = self.get_serializer(products, many=True)
            return Response(serializer.data)
        except Vendor.DoesNotExist:
            return Response([])

    @action(detail=True, methods=['patch'], url_path='update-status', permission_classes=[IsAdmin])
    def update_status(self, request, pk=None):
        """Admin approves or rejects a product."""
        product = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(Product.STATUS_CHOICES):
            product.status = new_status
            product.save(update_fields=['status'])
            try:
                from notifications.services import notify_product_approved, notify_product_rejected
                if new_status == 'active':
                    notify_product_approved(product)
                elif new_status == 'suspended':
                    notify_product_rejected(product)
            except Exception:
                pass
            return Response(ProductSerializer(product).data)
        return Response({'error': 'حالة غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='pending', permission_classes=[IsAdmin])
    def pending_products(self, request):
        """Admin views pending products."""
        qs = Product.objects.filter(status='pending').select_related(
            'category', 'vendor'
        ).order_by('-created_at')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class ProductReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ProductReviewSerializer
    
    def get_queryset(self):
        return ProductReview.objects.filter(product_id=self.kwargs.get('product_pk'))

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs.get('product_pk'))


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
