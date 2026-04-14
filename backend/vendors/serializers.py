from rest_framework import serializers
from .models import Vendor

class VendorSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ('user', 'total_sales', 'total_commission_paid', 'rating', 'status', 'is_verified')
