from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'type_display', 'title', 'message', 'link', 'is_read', 'created_at', 'time_ago')
        read_only_fields = ('notification_type', 'title', 'message', 'link', 'created_at')
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        seconds = diff.total_seconds()
        if seconds < 60:
            return 'الآن'
        elif seconds < 3600:
            mins = int(seconds // 60)
            return f'منذ {mins} دقيقة' if mins > 1 else 'منذ دقيقة'
        elif seconds < 86400:
            hours = int(seconds // 3600)
            return f'منذ {hours} ساعة' if hours > 1 else 'منذ ساعة'
        else:
            days = int(seconds // 86400)
            return f'منذ {days} يوم' if days > 1 else 'منذ يوم'
