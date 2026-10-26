from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from .models import Usuario


def firmar_token(usuario):
    ahora = datetime.now(timezone.utc)
    payload = {
        'sub': str(usuario.pk),
        'rol': usuario.rol,
        'iat': ahora,
        'exp': ahora + timedelta(hours=settings.JWT['HORAS_EXPIRACION']),
    }
    return jwt.encode(payload, settings.JWT['SECRET'], algorithm='HS256')


class JWTAuthentication(authentication.BaseAuthentication):
    """Lee 'Authorization: Bearer <token>' y carga el usuario."""

    def authenticate(self, request):
        cabecera = request.headers.get('Authorization', '')
        if not cabecera:
            return None
        tipo, _, token = cabecera.partition(' ')
        if tipo != 'Bearer' or not token:
            raise exceptions.AuthenticationFailed('Se requiere un token Bearer')
        try:
            payload = jwt.decode(token, settings.JWT['SECRET'], algorithms=['HS256'])
            usuario = Usuario.objects.get(pk=payload['sub'], is_active=True)
        except (jwt.PyJWTError, Usuario.DoesNotExist, KeyError, ValueError):
            raise exceptions.AuthenticationFailed('Token inválido o expirado')
        return usuario, token

    def authenticate_header(self, request):
        # Hace que DRF responda 401 (y no 403) cuando falta el token
        return 'Bearer'
