"""Protecciones: IP real del cliente, límite de peticiones y bloqueo de login por fuerza bruta."""
import hashlib
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone

from .errores import ErrorNegocio
from .models import Auditoria, IntentoLogin

MAX_FALLOS = 5
BLOQUEO = timedelta(minutes=15)


def ip_cliente(request):
    # Detrás del proxy de Render la IP real es la ÚLTIMA de X-Forwarded-For (la que agregó el proxy;
    # las anteriores las puede inventar el cliente)
    reenviada = request.META.get('HTTP_X_FORWARDED_FOR')
    return reenviada.split(',')[-1].strip() if reenviada else request.META.get('REMOTE_ADDR')


class LimitePeticiones:
    """Máximo N peticiones por IP por minuto. En memoria del proceso (con varias instancias se usaría Redis)."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.limite = settings.RATE_LIMIT_POR_MINUTO
        self.contadores = {}
        self.candado = threading.Lock()

    def __call__(self, request):
        if not request.path.endswith('/health'):
            ventana = int(time.time() // 60)
            clave = (ip_cliente(request), ventana)
            with self.candado:
                if len(self.contadores) > 10_000:  # limpiar ventanas viejas
                    self.contadores = {k: v for k, v in self.contadores.items() if k[1] == ventana}
                self.contadores[clave] = self.contadores.get(clave, 0) + 1
                excedido = self.contadores[clave] > self.limite
            if excedido:
                respuesta = JsonResponse({'error': {'codigo': 'LIMITE_PETICIONES',
                                                    'mensaje': 'Demasiadas peticiones desde tu red. Espera un momento.'}}, status=429)
                respuesta['Retry-After'] = str(60 - int(time.time()) % 60)
                return respuesta
        return self.get_response(request)


def _clave(ip, email):
    return hashlib.sha256(f'{ip}|{email}'.encode()).hexdigest()


def verificar_bloqueo(ip, email):
    intento = IntentoLogin.objects.filter(clave=_clave(ip, email), bloqueado_hasta__gt=timezone.now()).first()
    if intento:
        segundos = int((intento.bloqueado_hasta - timezone.now()).total_seconds()) + 1
        error = ErrorNegocio(429, 'DEMASIADOS_INTENTOS',
                             f'Demasiados intentos fallidos. Intenta de nuevo en {-(-segundos // 60)} minuto(s).')
        error.cabeceras = {'Retry-After': str(segundos)}
        raise error


@transaction.atomic
def registrar_fallo(ip, email):
    ahora = timezone.now()
    intento, creado = IntentoLogin.objects.select_for_update().get_or_create(
        clave=_clave(ip, email), defaults={'fallos': 0, 'primer_fallo': ahora})
    if not creado and ahora - intento.primer_fallo > BLOQUEO:  # los fallos viejos no cuentan
        intento.fallos, intento.primer_fallo = 0, ahora
    intento.fallos += 1
    if intento.fallos >= MAX_FALLOS:
        intento.fallos, intento.primer_fallo, intento.bloqueado_hasta = 0, ahora, ahora + BLOQUEO
        Auditoria.objects.create(accion='auth.bloqueo', entidad='usuario', entidad_id=email, ip=ip,
                                 detalle={'email': email, 'minutos': int(BLOQUEO.total_seconds() // 60)})
    intento.save()


def limpiar_fallos(ip, email):
    IntentoLogin.objects.filter(clave=_clave(ip, email)).delete()
