from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F, FloatField, Avg
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, TruncYear
from django.utils import timezone
from datetime import timedelta
from core.permissions import IsAdmin, IsAdminOrVendor
from orders.models import Order, Transaction
from products.models import Product

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminOrVendor]

    def _get_date_range(self, request):
        period = request.query_params.get('period', 'monthly')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        now = timezone.now()
        
        if start_date_str and end_date_str:
            import dateutil.parser
            try:
                start_date = dateutil.parser.parse(start_date_str)
                end_date = dateutil.parser.parse(end_date_str)
                return start_date, end_date
            except:
                pass
                
        if period == 'daily':
            return now - timedelta(days=7), now
        elif period == 'weekly':
            return now - timedelta(weeks=4), now
        elif period == 'yearly':
            return now - timedelta(days=365*5), now
        else: # monthly default
            return now - timedelta(days=365), now

    def _get_trunc_func(self, period):
        if period == 'daily': return TruncDate
        if period == 'weekly': return TruncWeek
        if period == 'yearly': return TruncYear
        return TruncMonth

    @action(detail=False, methods=['get'], url_path='sales')
    def sales(self, request):
        """Sales report (Admin sees all, Vendor sees theirs)."""
        start_date, end_date = self._get_date_range(request)
        period = request.query_params.get('period', 'monthly')
        trunc_func = self._get_trunc_func(period)
        
        user = request.user
        queryset = Order.objects.filter(created_at__gte=start_date, created_at__lte=end_date, is_paid=True)
        
        if user.role == 'vendor':
            from vendors.models import Vendor
            vendor = Vendor.objects.get(user=user)
            queryset = queryset.filter(items__vendor=vendor).distinct()
            
        sales_trend = queryset.annotate(
            date=trunc_func('created_at')
        ).values('date').annotate(
            total_sales=Sum('total_price'),
            orders_count=Count('id')
        ).order_by('date')
        
        summary = queryset.aggregate(
            total_revenue=Sum('total_price'),
            total_orders=Count('id'),
            average_order_value=Avg('total_price')
        )
        
        return Response({
            'period': period,
            'summary': summary,
            'trend': sales_trend
        })

    @action(detail=False, methods=['get'], url_path='products-performance')
    def products_performance(self, request):
        user = request.user
        queryset = Product.objects.all()
        
        if user.role == 'vendor':
            from vendors.models import Vendor
            vendor = Vendor.objects.get(user=user)
            queryset = queryset.filter(vendor=vendor)
            
        top_selling = queryset.order_by('-sold_count')[:10].values(
            'id', 'name', 'sold_count', 'stock_quantity', 'price'
        )
        
        low_stock = queryset.filter(stock_quantity__lt=10).order_by('stock_quantity').values(
            'id', 'name', 'stock_quantity'
        )
        
        return Response({
            'top_selling': top_selling,
            'low_stock': low_stock
        })
