from rest_framework import serializers
from .models import Order, OrderItem, Transaction
from .payment_config import PaymentAccount


class OrderItemSerializer(serializers.ModelSerializer):
    vendor_name = serializers.ReadOnlyField(source='vendor.store_name')
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_price', 'quantity', 'total', 'vendor_name')
        read_only_fields = ('total',)


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = (
            'full_name', 'phone', 'city', 'address', 'notes',
            'payment_method', 'transfer_number', 'receipt_image', 'coupon_code',
            'wallet_number', 'wallet_transaction_id', 'card_last_four', 'payment_reference',
            'items'
        )

    def to_internal_value(self, data):
        if 'items' in data and isinstance(data['items'], str):
            import json
            try:
                if hasattr(data, 'copy'):
                    data = data.copy()
                data['items'] = json.loads(data['items'])
            except Exception:
                pass
        return super().to_internal_value(data)

    def validate(self, attrs):
        payment_method = attrs.get('payment_method', 'cash')
        
        # Validate wallet payments require transaction ID
        if payment_method in ('floosak', 'jawali', 'kuraimi'):
            if not attrs.get('wallet_transaction_id'):
                raise serializers.ValidationError({
                    'wallet_transaction_id': 'يرجى إدخال رقم عملية التحويل'
                })
        
        # Validate bank transfer requires transfer number or receipt
        if payment_method == 'transfer':
            if not attrs.get('transfer_number') and not attrs.get('receipt_image'):
                raise serializers.ValidationError({
                    'transfer_number': 'يرجى إدخال رقم الحوالة أو إرفاق صورة السند'
                })
        
        # Credit card simulation - just validate card_last_four format
        if payment_method == 'credit_card':
            card_last_four = attrs.get('card_last_four', '')
            if not card_last_four or len(card_last_four) != 4 or not card_last_four.isdigit():
                raise serializers.ValidationError({
                    'card_last_four': 'بيانات البطاقة غير صحيحة'
                })
            # For simulation, auto-generate a payment reference
            import uuid
            attrs['payment_reference'] = f"CC-{uuid.uuid4().hex[:8].upper()}"
            attrs['is_paid'] = True  # Simulate successful payment
            attrs['payment_confirmed'] = True
        
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        from products.models import Product
        from decimal import Decimal

        # Calculate subtotal
        subtotal = Decimal('0.00')
        resolved_items = []
        for item_data in items_data:
            try:
                product = Product.objects.select_related('vendor').get(id=item_data['product_id'])
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"المنتج رقم {item_data['product_id']} غير موجود")
            
            qty = item_data['quantity']
            item_total = product.price * qty
            subtotal += item_total
            resolved_items.append({
                'product': product,
                'vendor': product.vendor,
                'product_name': product.name,
                'product_price': product.price,
                'quantity': qty,
            })

        # Calculate discount
        discount_amount = Decimal('0.00')
        coupon_code = validated_data.get('coupon_code', '')
        if coupon_code:
            try:
                from .models import Coupon
                coupon = Coupon.objects.get(code=coupon_code)
                if coupon.is_valid():
                    discount_amount = subtotal * Decimal(coupon.discount_percentage) / Decimal('100.00')
            except Exception:
                pass

        # Calculate shipping cost
        shipping_cost = Decimal('0.00')
        city = validated_data.get('city', '')
        try:
            from shipping.models import ShippingZone
            zone = ShippingZone.objects.filter(city=city, is_available=True).first()
            if zone:
                final_subtotal = subtotal - discount_amount
                if zone.free_shipping_threshold and final_subtotal >= zone.free_shipping_threshold:
                    shipping_cost = Decimal('0.00')
                else:
                    shipping_cost = zone.base_cost
        except Exception:
            pass

        # Create order
        order = Order.objects.create(
            subtotal=subtotal,
            discount_amount=discount_amount,
            shipping_cost=shipping_cost,
            **validated_data
        )

        # Create order items and update stock
        vendor_totals = {}
        for item in resolved_items:
            product = item.pop('product')
            vendor = item.get('vendor')
            qty = item['quantity']
            item_total = Decimal(str(product.price)) * Decimal(str(qty))

            OrderItem.objects.create(order=order, product=product, **item)
            
            if vendor:
                if vendor not in vendor_totals:
                    vendor_totals[vendor] = Decimal('0.00')
                vendor_totals[vendor] += item_total

            # Update stock
            product.stock_quantity = max(0, product.stock_quantity - qty)
            product.sold_count += qty
            product.save(update_fields=['stock_quantity', 'sold_count'])

        # Create transactions for each vendor
        for vendor, amount in vendor_totals.items():
            # استخدام نسبة عمولة كل متجر بدلاً من 5% الثابتة
            commission_rate = getattr(vendor, 'commission_rate', Decimal('5.00')) / Decimal('100')
            commission_amount = amount * commission_rate
            vendor_net = amount - commission_amount
            tx = Transaction(
                order=order,
                vendor=vendor,
                transaction_type='sale',
                amount=amount,
                commission=commission_amount,
                vendor_amount=vendor_net,
            )
            tx.save()
            try:
                from notifications.services import notify_vendor_transaction
                notify_vendor_transaction(tx)
            except Exception:
                pass

        return order


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    username = serializers.ReadOnlyField(source='user.username')
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('order_number', 'platform_commission', 'user', 'subtotal', 'total_price')


class TransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.ReadOnlyField(source='order.order_number')
    store_name = serializers.ReadOnlyField(source='vendor.store_name')
    
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('commission', 'vendor_amount')


class PaymentAccountSerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    
    class Meta:
        model = PaymentAccount
        fields = '__all__'
        read_only_fields = ('updated_at', 'updated_by')
