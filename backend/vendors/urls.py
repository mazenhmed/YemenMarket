from rest_framework.routers import DefaultRouter
from .views import VendorViewSet

router = DefaultRouter()
router.register(r'stores', VendorViewSet)

urlpatterns = router.urls
