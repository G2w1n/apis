"""
Lógica de negocio. Las vistas solo traducen HTTP <-> estas funciones.

Estrategia anti-sobreventa en PostgreSQL:
  transaction.atomic()  -> todo o nada
  select_for_update()   -> bloquea las filas de los productos hasta terminar la transacción;
                           una segunda compra simultánea ESPERA y luego ve el stock ya descontado.
  CheckConstraint       -> la base de datos rechaza stock < 0 aunque el código fallara.
"""
from collections import OrderedDict
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.db.models import Count, F, Sum

from .errores import ErrorNegocio, no_encontrado
from .models import Categoria, DetallePedido, HistorialEstado, MovimientoStock, Pedido, Producto


def _categoria(categoria_id):
    if categoria_id is None:
        return None
    try:
        return Categoria.objects.get(pk=categoria_id)
    except Categoria.DoesNotExist:
        raise ErrorNegocio(422, 'CATEGORIA_INVALIDA', 'La categoría indicada no existe')


# ---------- Productos ----------

@transaction.atomic
def crear_producto(datos, usuario):
    if Producto.objects.filter(sku=datos['sku']).exists():
        raise ErrorNegocio(409, 'SKU_DUPLICADO', f"Ya existe un producto con SKU {datos['sku']}")
    categoria = _categoria(datos.pop('categoria_id', None))
    try:
        with transaction.atomic():
            producto = Producto.objects.create(categoria=categoria, **datos)
    except IntegrityError:  # dos altas simultáneas con el mismo SKU
        raise ErrorNegocio(409, 'SKU_DUPLICADO', f"Ya existe un producto con SKU {datos['sku']}")
    if producto.stock > 0:
        MovimientoStock.objects.create(producto=producto, tipo='entrada', cantidad=producto.stock,
                                       stock_resultante=producto.stock, motivo='Stock inicial', usuario=usuario)
    return producto


@transaction.atomic
def actualizar_producto(producto_id, datos):
    producto = Producto.objects.select_for_update().filter(pk=producto_id, activo=True).first()
    if not producto:
        raise no_encontrado('Producto')
    if 'sku' in datos and Producto.objects.filter(sku=datos['sku']).exclude(pk=producto.pk).exists():
        raise ErrorNegocio(409, 'SKU_DUPLICADO', f"Ya existe un producto con SKU {datos['sku']}")
    if 'categoria_id' in datos:
        producto.categoria = _categoria(datos.pop('categoria_id'))
    for campo, valor in datos.items():
        setattr(producto, campo, valor)
    producto.save()
    return producto


def eliminar_producto(producto_id):
    # Borrado lógico: el kardex y los pedidos antiguos siguen apuntando al producto
    if not Producto.objects.filter(pk=producto_id, activo=True).update(activo=False):
        raise no_encontrado('Producto')


# ---------- Pedidos ----------

def _agrupar(items):
    agrupados = OrderedDict()
    for item in items:
        agrupados[item['producto_id']] = agrupados.get(item['producto_id'], 0) + item['cantidad']
    return agrupados


def crear_pedido(usuario, items, clave_idempotencia=None):
    """Devuelve (pedido, repetido). Si la Idempotency-Key ya se usó, devuelve el pedido original."""
    if clave_idempotencia:
        previo = Pedido.objects.filter(usuario=usuario, idempotency_key=clave_idempotencia).first()
        if previo:
            return previo, True
    try:
        return _crear_pedido_atomico(usuario, _agrupar(items), clave_idempotencia), False
    except IntegrityError:
        # Dos peticiones con la misma clave llegaron a la vez: la restricción UNIQUE frenó a una
        previo = Pedido.objects.filter(usuario=usuario, idempotency_key=clave_idempotencia).first()
        if previo:
            return previo, True
        raise


@transaction.atomic
def _crear_pedido_atomico(usuario, cantidades, clave_idempotencia):
    # Ordenar por id evita deadlocks cuando dos pedidos bloquean los mismos productos
    productos = {p.id: p for p in Producto.objects.select_for_update().filter(pk__in=cantidades, activo=True).order_by('id')}

    no_disponibles = [{'producto_id': pid} for pid in cantidades if pid not in productos]
    if no_disponibles:
        raise ErrorNegocio(422, 'PRODUCTO_NO_DISPONIBLE', 'Algunos productos no existen o fueron retirados', no_disponibles)
    sin_stock = [
        {'producto_id': pid, 'nombre': productos[pid].nombre, 'solicitado': cant, 'disponible': productos[pid].stock}
        for pid, cant in cantidades.items() if productos[pid].stock < cant
    ]
    if sin_stock:
        raise ErrorNegocio(409, 'STOCK_INSUFICIENTE', 'No hay stock suficiente', sin_stock)

    # Decimal = aritmética exacta: 0.1 + 0.2 == 0.3
    total = sum((productos[pid].precio * cant for pid, cant in cantidades.items()), Decimal('0'))
    pedido = Pedido.objects.create(usuario=usuario, total=total, idempotency_key=clave_idempotencia)
    HistorialEstado.objects.create(pedido=pedido, estado='pendiente')

    for pid, cant in cantidades.items():
        p = productos[pid]
        p.stock -= cant
        p.save(update_fields=['stock', 'updated_at'])
        DetallePedido.objects.create(pedido=pedido, producto=p, sku=p.sku, nombre=p.nombre, cantidad=cant,
                                     precio_unitario=p.precio, subtotal=p.precio * cant)
        MovimientoStock.objects.create(producto=p, tipo='salida', cantidad=cant, stock_resultante=p.stock,
                                       motivo=f'Venta - pedido {pedido.id}', pedido=pedido, usuario=usuario)
    return pedido


def pedidos_visibles(usuario):
    qs = Pedido.objects.prefetch_related('items', 'historial')
    return qs if usuario.rol == 'admin' else qs.filter(usuario=usuario)


def _pedido_bloqueado(pedido_id, usuario):
    # Un cliente que pide un pedido ajeno recibe 404: no revelamos que existe
    pedido = Pedido.objects.select_for_update().filter(pk=pedido_id).first()
    if not pedido or (usuario.rol != 'admin' and pedido.usuario_id != usuario.id):
        raise no_encontrado('Pedido')
    return pedido


def _validar_transicion(actual, nuevo):
    permitidos = Pedido.TRANSICIONES[actual]
    if nuevo not in permitidos:
        raise ErrorNegocio(422, 'TRANSICION_INVALIDA', f'No se puede pasar de "{actual}" a "{nuevo}"',
                           {'estado_actual': actual, 'permitidos': permitidos})


@transaction.atomic
def cancelar_pedido(pedido_id, usuario):
    pedido = _pedido_bloqueado(pedido_id, usuario)
    _validar_transicion(pedido.estado, 'cancelado')
    detalles = list(pedido.items.all())
    productos = {p.id: p for p in Producto.objects.select_for_update().filter(pk__in=[d.producto_id for d in detalles]).order_by('id')}
    for d in detalles:
        p = productos[d.producto_id]
        p.stock += d.cantidad
        p.save(update_fields=['stock', 'updated_at'])
        MovimientoStock.objects.create(producto=p, tipo='entrada', cantidad=d.cantidad, stock_resultante=p.stock,
                                       motivo=f'Cancelación - pedido {pedido.id}', pedido=pedido, usuario=usuario)
    pedido.estado = 'cancelado'
    pedido.save(update_fields=['estado'])
    HistorialEstado.objects.create(pedido=pedido, estado='cancelado')
    return pedido


@transaction.atomic
def cambiar_estado(pedido_id, estado, usuario):
    if estado == 'cancelado':
        return cancelar_pedido(pedido_id, usuario)
    pedido = _pedido_bloqueado(pedido_id, usuario)
    _validar_transicion(pedido.estado, estado)
    pedido.estado = estado
    pedido.save(update_fields=['estado'])
    HistorialEstado.objects.create(pedido=pedido, estado=estado)
    return pedido


# ---------- Stock ----------

@transaction.atomic
def registrar_movimiento(datos, usuario):
    producto = Producto.objects.select_for_update().filter(pk=datos['producto_id'], activo=True).first()
    if not producto:
        raise no_encontrado('Producto')
    cantidad = datos['cantidad']
    if datos['tipo'] == 'salida' and producto.stock < cantidad:
        raise ErrorNegocio(409, 'STOCK_INSUFICIENTE', 'No hay stock suficiente para esta salida', [
            {'producto_id': producto.id, 'nombre': producto.nombre, 'solicitado': cantidad, 'disponible': producto.stock}])
    producto.stock += cantidad if datos['tipo'] == 'entrada' else -cantidad
    producto.save(update_fields=['stock', 'updated_at'])
    return MovimientoStock.objects.create(producto=producto, tipo=datos['tipo'], cantidad=cantidad,
                                          stock_resultante=producto.stock, motivo=datos['motivo'], usuario=usuario)


def reporte():
    """Todo se calcula en SQL con agregaciones (SUM, COUNT, GROUP BY) en lugar de traer filas a memoria."""
    activos = Producto.objects.filter(activo=True)
    inventario = activos.aggregate(unidades=Sum('stock'), valor=Sum(F('precio') * F('stock')), total=Count('id'))
    por_estado = {e: 0 for e in Pedido.Estado.values}
    por_estado.update(dict(Pedido.objects.values_list('estado').annotate(n=Count('id'))))
    vendidos = (DetallePedido.objects.exclude(pedido__estado='cancelado')
                .values('producto_id', 'nombre')
                .annotate(unidades=Sum('cantidad'), ingresos=Sum('subtotal'))
                .order_by('-unidades')[:5])
    ingresos = Pedido.objects.exclude(estado='cancelado').aggregate(t=Sum('total'))['t'] or 0
    return {
        'total_productos': inventario['total'],
        'unidades_en_stock': inventario['unidades'] or 0,
        'valor_inventario': float(inventario['valor'] or 0),
        'productos_bajo_stock': activos.filter(stock__lte=F('stock_minimo')).count(),
        'ingresos_totales': float(ingresos),
        'pedidos_por_estado': por_estado,
        'mas_vendidos': [{**v, 'ingresos': float(v['ingresos'])} for v in vendidos],
    }
