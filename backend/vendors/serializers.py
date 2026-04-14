from rest_framework import serializers
from .models import Vendor, VendorPaymentAccount

class VendorSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ('user', 'total_sales', 'total_commission_paid', 'rating', 'status', 'is_verified')


class VendorPaymentAccountSerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)

    class Meta:
        model = VendorPaymentAccount
        fields = '__all__'
        read_only_fields = ('vendor', 'created_at')
