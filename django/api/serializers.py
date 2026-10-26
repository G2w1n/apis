"""Serializers = validación de entrada + formato JSON de salida (equivalen a los esquemas Zod de Express)."""
from decimal import Decimal

from rest_framework import serializers

from .models import Categoria, DetallePedido, MovimientoStock, Pedido, Producto, Usuario


# ---------- Entrada ----------

class RegistroSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=72)

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
                  'categoria', 'activo', 'created_at', 'updated_at']


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


class MovimientoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)

    class Meta:
        model = MovimientoStock
        fields = ['id', 'producto_id', 'producto_nombre', 'tipo', 'cantidad', 'stock_resultante', 'motivo',
                  'pedido_id', 'usuario_id', 'created_at']
