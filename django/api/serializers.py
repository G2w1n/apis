"""Serializers = validación de entrada + formato JSON de salida (equivalen a los esquemas Zod de Express)."""
import re
from decimal import Decimal

from rest_framework import serializers

from .models import Auditoria, Categoria, DetallePedido, MovimientoStock, Pedido, Producto, Usuario


def password_fuerte(valor):
    """Evita claves fáciles de adivinar como "12345678" o "password"."""
    reglas = [(r'[A-Z]', 'Debe tener al menos una mayúscula'), (r'[a-z]', 'Debe tener al menos una minúscula'),
              (r'\d', 'Debe tener al menos un número'), (r'[^A-Za-z0-9]', 'Debe tener al menos un símbolo')]
    errores = [mensaje for patron, mensaje in reglas if not re.search(patron, valor)]
    if errores:
        raise serializers.ValidationError(errores)


def url_segura(valor):
    """Solo http(s) o rutas relativas: bloquea "javascript:" y otros esquemas peligrosos."""
    if valor and not re.match(r'^(https?://|/)', valor):
        raise serializers.ValidationError('Debe ser una URL http(s) o una ruta que empiece con /')


# ---------- Entrada ----------

class RegistroSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=72, validators=[password_fuerte])

    def validate_email(self, valor):
        return valor.strip().lower()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class CategoriaEntradaSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=60)
    descripcion = serializers.CharField(max_length=300, required=False, allow_blank=True, default='')


class ProductoEntradaSerializer(serializers.Serializer):
    sku = serializers.CharField(max_length=30)
    nombre = serializers.CharField(max_length=120)
    descripcion = serializers.CharField(required=False, allow_blank=True, default='', max_length=1000)
    precio = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    stock = serializers.IntegerField(min_value=0, required=False, default=0)
    stock_minimo = serializers.IntegerField(min_value=0, required=False, default=0)
    categoria_id = serializers.IntegerField(required=False, allow_null=True)
    imagen_url = serializers.CharField(required=False, allow_null=True, max_length=500, validators=[url_segura])

    def validate_sku(self, valor):
        return valor.strip().upper()

    def validate(self, datos):
        # En una actualización el stock no se edita: solo cambia mediante movimientos (kardex)
        if self.partial and 'stock' in self.initial_data:
            raise serializers.ValidationError({'stock': 'El stock solo se modifica con POST /stock/movimientos'})
        if self.partial and not datos:
            raise serializers.ValidationError('Envíe al menos un campo')
        return datos


class ItemPedidoSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1, max_value=1000)


class PedidoEntradaSerializer(serializers.Serializer):
    items = ItemPedidoSerializer(many=True, allow_empty=False, max_length=50)


class EstadoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Pedido.Estado.values)


class MovimientoEntradaSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField()
    tipo = serializers.ChoiceField(choices=MovimientoStock.Tipo.values)
    cantidad = serializers.IntegerField(min_value=1, max_value=100_000)
    motivo = serializers.CharField(max_length=200)


# ---------- Salida ----------

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'email', 'rol']


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion']


class CategoriaResumenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nombre']


class ProductoSerializer(serializers.ModelSerializer):
    bajo_stock = serializers.BooleanField(read_only=True)
    categoria = CategoriaResumenSerializer(read_only=True)

    class Meta:
        model = Producto
        fields = ['id', 'sku', 'nombre', 'descripcion', 'precio', 'stock', 'stock_minimo', 'bajo_stock',
                  'imagen_url', 'categoria', 'activo', 'created_at', 'updated_at']


class DetallePedidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetallePedido
        fields = ['producto_id', 'sku', 'nombre', 'cantidad', 'precio_unitario', 'subtotal']


class PedidoSerializer(serializers.ModelSerializer):
    items = DetallePedidoSerializer(many=True, read_only=True)
    historial = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = ['id', 'usuario_id', 'estado', 'total', 'items', 'historial', 'created_at']

    def get_historial(self, pedido):
        return [{'estado': h.estado, 'fecha': h.fecha} for h in pedido.historial.all()]


class AuditoriaSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=True, default=None)

    class Meta:
        model = Auditoria
        fields = ['id', 'accion', 'entidad', 'entidad_id', 'usuario_id', 'usuario_email', 'ip', 'detalle', 'created_at']


class MovimientoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = MovimientoStock
        fields = ['id', 'producto_id', 'producto_nombre', 'tipo', 'cantidad', 'stock_resultante', 'motivo',
                  'pedido_id', 'usuario_id', 'created_at']
