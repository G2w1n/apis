from pathlib import Path

from django.conf import settings
from django.db import transaction
from django.db.models import F, Q
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import servicios
from .autenticacion import firmar_token
from .errores import ErrorNegocio, no_encontrado
from .models import Auditoria, Categoria, MovimientoStock, Producto, Usuario
from .seguridad import ip_cliente, limpiar_fallos, registrar_fallo, verificar_bloqueo
from .permisos import EsAdmin
from .serializers import (AuditoriaSerializer, CategoriaEntradaSerializer, CategoriaSerializer, EstadoSerializer, LoginSerializer,
                          MovimientoEntradaSerializer, MovimientoSerializer, PedidoEntradaSerializer, PedidoSerializer,
                          ProductoEntradaSerializer, ProductoSerializer, RegistroSerializer, UsuarioSerializer)

ORDENES = {'nombre': 'nombre', 'precio': 'precio', 'stock': 'stock', 'creado': 'created_at'}


def _validar(serializer_class, request, **kwargs):
    s = serializer_class(data=request.data, **kwargs)
    s.is_valid(raise_exception=True)
    return s.validated_data


def _paginar(request, queryset, serializer_class):
    def entero(nombre, defecto):
        try:
            return int(request.query_params.get(nombre, defecto))
        except ValueError:
            return defecto
    page = max(1, entero('page', 1))
    limit = min(100, max(1, entero('limit', 10)))
    total = queryset.count()
    filas = queryset[(page - 1) * limit: page * limit]  # LIMIT/OFFSET en SQL
    return Response({
        'data': serializer_class(filas, many=True).data,
        'meta': {'page': page, 'limit': limit, 'total': total, 'paginas': -(-total // limit)},
    })


def _id(valor):
    """IDs no numéricos (ej. de Firestore) simplemente no existen aquí."""
    try:
        return int(valor)
    except (TypeError, ValueError):
        raise no_encontrado()


def salud(request):
    return JsonResponse({'status': 'ok', 'framework': 'django', 'base_datos': 'postgresql'})


def inicio(request):
    """Página de bienvenida: quien abra la URL base ve qué API es y qué rutas tiene."""
    return JsonResponse({
        'api': 'Tienda API (productos, pedidos y stock)', 'framework': 'django', 'base_datos': 'postgresql', 'version': 'v1',
        'documentacion': '/docs',
        'rutas': ['/api/v1/health', '/api/v1/productos', '/api/v1/categorias', '/api/v1/auth/login', '/api/v1/pedidos',
                  '/api/v1/stock/reporte', '/admin/'],
        'repositorio': 'https://github.com/G2w1n/apis',
    })


def ruta_no_encontrada(request):
    return JsonResponse({'error': {'codigo': 'RUTA_NO_ENCONTRADA', 'mensaje': f'No existe {request.method} {request.path}'}},
                        status=404)


# ---------- Autenticación ----------

@api_view(['POST'])
def registro(request):
    datos = _validar(RegistroSerializer, request)
    if Usuario.objects.filter(email=datos['email']).exists():
        raise ErrorNegocio(409, 'EMAIL_EN_USO', 'El email ya está registrado')
    usuario = Usuario.objects.create_user(**datos)
    return Response({'usuario': UsuarioSerializer(usuario).data, 'token': firmar_token(usuario)}, status=201)


@api_view(['POST'])
def login(request):
    datos = _validar(LoginSerializer, request)
    email, ip = datos['email'].lower(), ip_cliente(request)
    verificar_bloqueo(ip, email)  # 429 si esta IP + email está bloqueada por intentos fallidos
    usuario = Usuario.objects.filter(email=email, is_active=True).first()
    if not usuario or not usuario.check_password(datos['password']):
        registrar_fallo(ip, email)
        raise ErrorNegocio(401, 'CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos')
    limpiar_fallos(ip, email)
    return Response({'usuario': UsuarioSerializer(usuario).data, 'token': firmar_token(usuario)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def yo(request):
    return Response(UsuarioSerializer(request.user).data)


# ---------- Categorías ----------

@api_view(['GET', 'POST'])
def categorias(request):
    if request.method == 'GET':
        return Response({'data': CategoriaSerializer(Categoria.objects.all(), many=True).data})
    _exigir_admin(request)
    datos = _validar(CategoriaEntradaSerializer, request)
    if Categoria.objects.filter(nombre__iexact=datos['nombre']).exists():
        raise ErrorNegocio(409, 'CATEGORIA_DUPLICADA', 'Ya existe una categoría con ese nombre')
    with transaction.atomic():
        categoria = Categoria.objects.create(**datos)
        servicios.auditar(request.user, ip_cliente(request), 'categoria.crear', 'categoria', categoria.id, {'nombre': categoria.nombre})
    return Response(CategoriaSerializer(categoria).data, status=201)


def _no_autenticado():
    raise ErrorNegocio(401, 'NO_AUTENTICADO', 'Se requiere un token Bearer')


def _exigir_admin(request):
    if request.user is None:
        _no_autenticado()
    if request.user.rol != 'admin':
        raise ErrorNegocio(403, 'PROHIBIDO', EsAdmin.message)


# ---------- Productos ----------

@api_view(['GET', 'POST'])
def productos(request):
    if request.method == 'POST':
        _exigir_admin(request)
        producto = servicios.crear_producto(dict(_validar(ProductoEntradaSerializer, request)), request.user, ip_cliente(request))
        return Response(ProductoSerializer(producto).data, status=201)

    # Los filtros se traducen a SQL (WHERE / ILIKE / ORDER BY): la base de datos hace el trabajo
    p = request.query_params
    qs = Producto.objects.filter(activo=True).select_related('categoria')
    if p.get('q'):
        qs = qs.filter(Q(nombre__icontains=p['q']) | Q(sku__icontains=p['q']))
    if p.get('categoria'):
        qs = qs.filter(categoria_id=_id(p['categoria']))
    if p.get('precio_min'):
        qs = qs.filter(precio__gte=p['precio_min'])
    if p.get('precio_max'):
        qs = qs.filter(precio__lte=p['precio_max'])
    if p.get('bajo_stock') == 'true':
        qs = qs.filter(stock__lte=F('stock_minimo'))
    orden = p.get('orden', 'nombre')
    campo = ORDENES.get(orden.lstrip('-'), 'nombre')
    qs = qs.order_by(f"{'-' if orden.startswith('-') else ''}{campo}", 'id')
    return _paginar(request, qs, ProductoSerializer)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def producto_detalle(request, pk):
    pk = _id(pk)
    if request.method == 'GET':
        producto = Producto.objects.select_related('categoria').filter(pk=pk, activo=True).first()
        if not producto:
            raise no_encontrado('Producto')
        return Response(ProductoSerializer(producto).data)
    _exigir_admin(request)
    if request.method == 'DELETE':
        servicios.eliminar_producto(pk, request.user, ip_cliente(request))
        return Response(status=204)
    datos = dict(_validar(ProductoEntradaSerializer, request, partial=True))
    for campo in ('descripcion', 'stock', 'stock_minimo'):  # quitar valores por defecto no enviados
        if campo not in request.data:
            datos.pop(campo, None)
    return Response(ProductoSerializer(servicios.actualizar_producto(pk, datos, request.user, ip_cliente(request))).data)


# ---------- Pedidos ----------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pedidos(request):
    if request.method == 'POST':
        datos = _validar(PedidoEntradaSerializer, request)
        clave = request.headers.get('Idempotency-Key')
        pedido, repetido = servicios.crear_pedido(request.user, datos['items'], clave)
        pedido = servicios.pedidos_visibles(request.user).get(pk=pedido.pk)
        respuesta = Response(PedidoSerializer(pedido).data, status=200 if repetido else 201)
        if repetido:
            respuesta['Idempotent-Replayed'] = 'true'
        return respuesta
    qs = servicios.pedidos_visibles(request.user)
    if request.query_params.get('estado'):
        qs = qs.filter(estado=request.query_params['estado'])
    return _paginar(request, qs, PedidoSerializer)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pedido_detalle(request, pk):
    pedido = servicios.pedidos_visibles(request.user).filter(pk=_id(pk)).first()
    if not pedido:
        raise no_encontrado('Pedido')
    return Response(PedidoSerializer(pedido).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, EsAdmin])
def pedido_estado(request, pk):
    datos = _validar(EstadoSerializer, request)
    pedido = servicios.cambiar_estado(_id(pk), datos['estado'], request.user, ip_cliente(request))
    return Response(PedidoSerializer(servicios.pedidos_visibles(request.user).get(pk=pedido.pk)).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pedido_cancelar(request, pk):
    pedido = servicios.cancelar_pedido(_id(pk), request.user, ip_cliente(request))
    return Response(PedidoSerializer(servicios.pedidos_visibles(request.user).get(pk=pedido.pk)).data)


# ---------- Stock ----------

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, EsAdmin])
def movimientos(request):
    if request.method == 'POST':
        mov = servicios.registrar_movimiento(_validar(MovimientoEntradaSerializer, request), request.user, ip_cliente(request))
        return Response(MovimientoSerializer(mov).data, status=201)
    qs = MovimientoStock.objects.select_related('producto')
    if request.query_params.get('producto_id'):
        qs = qs.filter(producto_id=_id(request.query_params['producto_id']))
    if request.query_params.get('tipo'):
        qs = qs.filter(tipo=request.query_params['tipo'])
    return _paginar(request, qs, MovimientoSerializer)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsAdmin])
def alertas(request):
    qs = (Producto.objects.filter(activo=True, stock__lte=F('stock_minimo'))
          .select_related('categoria').annotate(faltante=F('stock_minimo') - F('stock')).order_by('-faltante', 'id'))
    return Response({'data': [{**ProductoSerializer(p).data, 'faltante': p.faltante} for p in qs]})


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsAdmin])
def reporte(request):
    return Response(servicios.reporte())


# ---------- Auditoría ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated, EsAdmin])
def auditoria(request):
    qs = Auditoria.objects.select_related('usuario')
    for campo in ('entidad', 'entidad_id', 'accion'):
        if request.query_params.get(campo):
            qs = qs.filter(**{campo: request.query_params[campo]})
    return _paginar(request, qs, AuditoriaSerializer)


# ---------- Documentación (Swagger compartido en ../shared) ----------

_SHARED = Path(settings.BASE_DIR).parent / 'shared'
# Swagger UI carga JS y CSS desde unpkg: esta página lleva su propia Content-Security-Policy
_CSP_DOCS = ("default-src 'self'; script-src 'self' https://unpkg.com; "
             "style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self'")


def _archivo(nombre, tipo, csp=False):
    def vista(request):
        respuesta = HttpResponse((_SHARED / nombre).read_text(encoding='utf-8'), content_type=tipo)
        if csp:
            respuesta['Content-Security-Policy'] = _CSP_DOCS
        return respuesta
    return vista


docs = _archivo('docs.html', 'text/html; charset=utf-8', csp=True)
docs_js = _archivo('docs.js', 'application/javascript')
openapi = _archivo('openapi.yaml', 'text/yaml; charset=utf-8')
