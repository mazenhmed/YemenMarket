from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Only admin users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsVendor(permissions.BasePermission):
    """Only vendor users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'vendor'


class IsAdminOrVendor(permissions.BasePermission):
    """Admin or vendor users."""
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and 
                request.user.role in ('admin', 'vendor'))


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Object owner can edit, others read only."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Check various owner fields
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False


class IsVendorOwner(permissions.BasePermission):
    """Vendor can only access their own store resources."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'vendor'):
            return obj.vendor.user == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
