from rest_framework import serializers
from .models import Product, Category, ProductReview, Wishlist, ProductImage, ProductVariant

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'additional_price', 'stock']


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
    
    def get_product_count(self, obj):
        return obj.products.filter(status='active').count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    vendor_name = serializers.ReadOnlyField(source='vendor.store_name')
    vendor_id = serializers.ReadOnlyField(source='vendor.id')
    vendor_logo = serializers.ImageField(source='vendor.logo', read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    is_on_sale = serializers.ReadOnlyField()
    gallery_images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('sold_count', 'rating', 'rating_count', 'status')

    def get_category_name(self, obj):
        if obj.category:
            return obj.category.name_ar or obj.category.name
        return None


class ProductCreateSerializer(serializers.ModelSerializer):
    """For vendors creating products."""
    class Meta:
        model = Product
        fields = ('name', 'description', 'price', 'compare_price', 'stock_quantity', 
                  'category', 'image', 'is_featured')
        extra_kwargs = {
            'image': {'required': True, 'allow_null': False}
        }

class ProductUpdateSerializer(serializers.ModelSerializer):
    """For vendors updating products."""
    class Meta:
        model = Product
        fields = ('name', 'description', 'price', 'compare_price', 'stock_quantity', 
                  'category', 'image', 'is_featured')
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True}
        }


class ProductReviewSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = ProductReview
        fields = '__all__'
        read_only_fields = ('user',)


class WishlistSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ('id', 'product', 'product_detail', 'created_at')
        read_only_fields = ('user',)
