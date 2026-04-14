from rest_framework import serializers
from .models import ShippingZone, ShipmentTracking


class ShippingZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingZone
        fields = '__all__'


class ShipmentTrackingSerializer(serializers.ModelSerializer):
    order_number = serializers.ReadOnlyField(source='order.order_number')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ShipmentTracking
        fields = '__all__'
        read_only_fields = ('tracking_number',)
