from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, TransactionViewSet, PaymentAccountViewSet

router = DefaultRouter()
router.register(r'checkout', OrderViewSet, basename='orders')
router.register(r'transactions', TransactionViewSet, basename='transactions')
router.register(r'payment-accounts', PaymentAccountViewSet, basename='payment-accounts')

urlpatterns = router.urls
