from django.db import models
from vendors.models import Vendor

class Category(models.Model):
    name = models.CharField(max_length=255)
    name_ar = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, blank=True)  # emoji icon
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['order']

    def __str__(self):
        return self.name_ar or self.name

class Product(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('out_of_stock', 'Out of Stock'),
        ('deleted', 'Deleted'),
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)  # original price for discounts
    stock_quantity = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products')
    image = models.ImageField(upload_to='products/images/', null=True, blank=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_featured = models.BooleanField(default=False)
    sold_count = models.IntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    rating_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def is_on_sale(self):
        return self.compare_price and self.compare_price > self.price
    
    @property
    def discount_percentage(self):
        if self.is_on_sale:
            return int(((self.compare_price - self.price) / self.compare_price) * 100)
        return 0

class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.username} on {self.product.name}"

class Wishlist(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='product_gallery/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.product.name}"

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=50, help_text="مثال: أحمر، XL، 128GB")
    additional_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} - {self.name}"
