from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import ProductViewSet, CategoryViewSet, ProductReviewViewSet, WishlistViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'items', ProductViewSet, basename='product')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = router.urls + [
    path('items/<int:product_pk>/reviews/', 
         ProductReviewViewSet.as_view({'get': 'list', 'post': 'create'}), 
         name='product-reviews'),
]
