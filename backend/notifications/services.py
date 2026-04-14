"""
Notification service — centralized notification creation.
Called by order/product/vendor views to send notifications.
"""
from .models import Notification
from users.models import User
from django.core.mail import send_mail
from django.conf import settings


def notify_user(user, notification_type, title, message, link=''):
    """Create a notification for a single user."""
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        link=link
    )


def notify_admins(notification_type, title, message, link=''):
    """Send notification to all admin users."""
    admins = User.objects.filter(role='admin')
    notifications = []
    for admin in admins:
        notifications.append(Notification(
            user=admin,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link
        ))
    Notification.objects.bulk_create(notifications)


def notify_order_created(order):
    """Notify customer + vendors + admins about new order."""
    # Notify customer
    notify_user(
        order.user, 'order_new',
        '🎉 تم إنشاء طلبك بنجاح',
        f'تم إنشاء الطلب رقم {order.order_number} بمبلغ {order.total_price:,.0f} ريال. سيتم التواصل معك قريباً.',
        f'/profile'
    )
    
    # Notify vendors involved
    vendor_ids = set()
    for item in order.items.all():
        if item.vendor and item.vendor.user_id not in vendor_ids:
            vendor_ids.add(item.vendor.user_id)
            notify_user(
                item.vendor.user, 'order_new',
                '🛒 طلب جديد!',
                f'لديك طلب جديد رقم {order.order_number} من {order.full_name} - {order.city}',
                f'/vendor/dashboard'
            )
    
    # Notify admins
    payment_labels = dict(order.PAYMENT_CHOICES)
    notify_admins(
        'order_new',
        f'📦 طلب جديد #{order.order_number}',
        f'طلب جديد من {order.full_name} بمبلغ {order.total_price:,.0f} ريال عبر {payment_labels.get(order.payment_method, order.payment_method)}',
        '/admin'
    )


def notify_order_status_changed(order):
    """Notify customer about order status change."""
    status_labels = {
        'confirmed': '✅ تم تأكيد طلبك',
        'processing': '⚙️ طلبك قيد التجهيز',
        'shipped': '🚚 تم شحن طلبك!',
        'delivered': '🎉 تم توصيل طلبك',
        'cancelled': '❌ تم إلغاء طلبك',
    }
    title = status_labels.get(order.status, f'تحديث طلبك #{order.order_number}')
    notify_user(
        order.user, 'order_status',
        title,
        f'تم تحديث حالة الطلب رقم {order.order_number} إلى: {order.get_status_display()}',
        '/profile'
    )


def notify_payment_confirmed(order):
    """Notify customer that payment has been confirmed."""
    notify_user(
        order.user, 'order_paid',
        '💰 تم تأكيد الدفع',
        f'تم تأكيد استلام الدفع للطلب رقم {order.order_number}',
        '/profile'
    )


def notify_product_approved(product):
    """Notify vendor that their product was approved."""
    notify_user(
        product.vendor.user, 'product_approved',
        '✅ تم قبول منتجك',
        f'تم قبول المنتج "{product.name}" وهو الآن متاح للعملاء في المنصة.',
        '/vendor/dashboard'
    )


def notify_product_rejected(product):
    """Notify vendor that their product was rejected."""
    notify_user(
        product.vendor.user, 'product_rejected',
        '❌ تم رفض منتجك',
        f'تم رفض المنتج "{product.name}". يرجى مراجعة بيانات المنتج وإعادة الإرسال.',
        '/vendor/dashboard'
    )


def notify_store_approved(vendor):
    """Notify vendor that their store was approved."""
    notify_user(
        vendor.user, 'store_approved',
        '🎉 تم اعتماد متجرك!',
        f'تهانينا! تم قبول متجر "{vendor.store_name}" وأصبح متاحاً للعملاء.',
        '/vendor/dashboard'
    )


def notify_store_suspended(vendor):
    """Notify vendor that their store was suspended."""
    notes = f' السبب: {vendor.admin_notes}' if vendor.admin_notes else ''
    notify_user(
        vendor.user, 'store_suspended',
        '⚠️ تم إيقاف متجرك',
        f'تم إيقاف متجر "{vendor.store_name}" مؤقتاً.{notes} يرجى التواصل مع الإدارة.',
        '/vendor/dashboard'
    )


def notify_welcome(user):
    """Welcome notification for new users."""
    notify_user(
        user, 'welcome',
        '👋 مرحباً بك في YemenMarket!',
        'أهلاً بك في منصة يمن ماركت. استمتع بالتسوق من أفضل المتاجر اليمنية.',
        '/'
    )


def send_email_notification(user, subject, html_body):
    """Send email notification (will work when EMAIL settings are configured)."""
    if not user.email:
        return
    try:
        send_mail(
            subject=subject,
            message='',
            html_message=html_body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@yemenmarket.com'),
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception:
        pass  # Email not configured yet — silently skip
