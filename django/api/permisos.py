from rest_framework.permissions import BasePermission


class EsAdmin(BasePermission):
    message = 'Solo un administrador puede realizar esta acción'

    def has_permission(self, request, view):
        return bool(request.user and request.user.rol == 'admin')
