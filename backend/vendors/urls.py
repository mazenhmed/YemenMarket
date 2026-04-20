from rest_framework.routers import DefaultRouter
from .views import VendorViewSet, VendorPaymentAccountViewSet

router = DefaultRouter()
router.register(r'stores', VendorViewSet, basename='stores')
router.register(r'payment-accounts', VendorPaymentAccountViewSet, basename='vendor-payment-accounts')

urlpatterns = router.urls
