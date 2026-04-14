from rest_framework.routers import DefaultRouter
from .views import ShippingZoneViewSet, ShipmentTrackingViewSet

router = DefaultRouter()
router.register(r'zones', ShippingZoneViewSet, basename='shipping-zones')
router.register(r'tracking', ShipmentTrackingViewSet, basename='shipment-tracking')

urlpatterns = router.urls
