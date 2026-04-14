from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from .models import ShippingZone, ShipmentTracking
from .serializers import ShippingZoneSerializer, ShipmentTrackingSerializer
from core.permissions import IsAdmin, IsAdminOrVendor


class ShippingZoneViewSet(viewsets.ModelViewSet):
    queryset = ShippingZone.objects.filter(is_available=True)
    serializer_class = ShippingZoneSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdmin()]

    @action(detail=False, methods=['get'], url_path='calculate')
    def calculate(self, request):
        """Calculate shipping cost for a city."""
        city = request.query_params.get('city', '')
        subtotal = request.query_params.get('subtotal', '0')
        
        try:
            subtotal = float(subtotal)
        except (ValueError, TypeError):
            subtotal = 0
        
        try:
            zone = ShippingZone.objects.get(city=city, is_available=True)
            shipping_cost = float(zone.base_cost)
            is_free = False
            
            if zone.free_shipping_threshold and subtotal >= float(zone.free_shipping_threshold):
                shipping_cost = 0
                is_free = True
            
            return Response({
                'city': zone.city,
                'shipping_cost': shipping_cost,
                'is_free': is_free,
                'free_threshold': float(zone.free_shipping_threshold) if zone.free_shipping_threshold else None,
                'estimated_days': f'{zone.estimated_days_min}-{zone.estimated_days_max}',
                'estimated_days_min': zone.estimated_days_min,
                'estimated_days_max': zone.estimated_days_max,
            })
        except ShippingZone.DoesNotExist:
            return Response({
                'city': city,
                'shipping_cost': 0,
                'is_free': True,
                'free_threshold': None,
                'estimated_days': '2-5',
                'message': 'المدينة غير مضافة حالياً — الشحن مجاني'
            })


class ShipmentTrackingViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentTrackingSerializer
    
    def get_permissions(self):
        if self.action in ['retrieve', 'track']:
            return [permissions.AllowAny()]
        return [IsAdminOrVendor()]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ShipmentTracking.objects.none()
        if user.role == 'admin':
            return ShipmentTracking.objects.all()
        if user.role == 'vendor':
            return ShipmentTracking.objects.filter(order__items__vendor__user=user).distinct()
        return ShipmentTracking.objects.filter(order__user=user)

    @action(detail=False, methods=['get'], url_path='by-number/(?P<tracking_number>[^/.]+)')
    def track(self, request, tracking_number=None):
        """Public tracking by tracking number."""
        try:
            shipment = ShipmentTracking.objects.get(tracking_number=tracking_number)
            return Response(ShipmentTrackingSerializer(shipment).data)
        except ShipmentTracking.DoesNotExist:
            return Response({'error': 'رقم التتبع غير صحيح'}, status=status.HTTP_404_NOT_FOUND)
