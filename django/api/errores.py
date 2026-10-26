"""Convierte cualquier error al formato común: {"error": {"codigo", "mensaje", "detalles"?}}."""
from django.db import OperationalError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response


class ErrorNegocio(exceptions.APIException):
    def __init__(self, status_code, codigo, mensaje, detalles=None):
        self.status_code = status_code
        self.codigo = codigo
        self.mensaje = mensaje
        self.detalles = detalles
        super().__init__(mensaje)


def no_encontrado(recurso='Recurso'):
    return ErrorNegocio(404, 'NO_ENCONTRADO', f'{recurso} no encontrado')


def _aplanar(errores, prefijo=''):
    """{'items': [{'cantidad': ['...']}]} -> [{'campo': 'items.0.cantidad', 'mensaje': '...'}]"""
    resultado = []
    if isinstance(errores, dict):
        for campo, valor in errores.items():
            nombre = '(body)' if campo == 'non_field_errors' else campo
            resultado += _aplanar(valor, f'{prefijo}.{nombre}' if prefijo else nombre)
    elif isinstance(errores, list):
        for i, valor in enumerate(errores):
            if isinstance(valor, (dict, list)):
                resultado += _aplanar(valor, f'{prefijo}.{i}')
            else:
                resultado.append({'campo': prefijo or '(body)', 'mensaje': str(valor)})
    else:
        resultado.append({'campo': prefijo or '(body)', 'mensaje': str(errores)})
    return resultado


def _respuesta(status_code, codigo, mensaje, detalles=None):
    error = {'codigo': codigo, 'mensaje': mensaje}
    if detalles:
        error['detalles'] = detalles
    return Response({'error': error}, status=status_code)


def manejar_excepcion(exc, context):
    if isinstance(exc, ErrorNegocio):
        return _respuesta(exc.status_code, exc.codigo, exc.mensaje, exc.detalles)
    if isinstance(exc, exceptions.ValidationError):
        return _respuesta(400, 'VALIDACION', 'Los datos enviados no son válidos', _aplanar(exc.detail))
    if isinstance(exc, exceptions.ParseError):
        return _respuesta(400, 'JSON_INVALIDO', 'El cuerpo no es JSON válido')
    if isinstance(exc, (exceptions.NotAuthenticated, exceptions.AuthenticationFailed)):
        mensaje = 'Se requiere un token Bearer' if isinstance(exc, exceptions.NotAuthenticated) else str(exc.detail)
        respuesta = _respuesta(401, 'NO_AUTENTICADO', mensaje)
        respuesta['WWW-Authenticate'] = 'Bearer'
        return respuesta
    if isinstance(exc, exceptions.PermissionDenied):
        return _respuesta(403, 'PROHIBIDO', str(exc.detail))
    if isinstance(exc, (Http404, exceptions.NotFound)):
        return _respuesta(404, 'NO_ENCONTRADO', 'Recurso no encontrado')
    if isinstance(exc, exceptions.MethodNotAllowed):
        return _respuesta(405, 'METODO_NO_PERMITIDO', str(exc.detail))
    if isinstance(exc, OperationalError) and 'deadlock' in str(exc).lower():
        return _respuesta(409, 'CONFLICTO_CONCURRENCIA', 'Demasiadas operaciones simultáneas, intente de nuevo')
    if isinstance(exc, exceptions.APIException):
        return _respuesta(exc.status_code, 'ERROR', str(exc.detail))
    return None  # error inesperado: Django devuelve 500
