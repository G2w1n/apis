"""Panel de administración en /admin/ — una ventaja de Django: CRUD visual sin escribir frontend."""
from django.contrib import admin

from .models import Categoria, DetallePedido, HistorialEstado, MovimientoStock, Pedido, Producto, Usuario


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['email', 'nombre', 'rol', 'is_active']
    list_filter = ['rol']
    search_fields = ['email', 'nombre']
    exclude = ['password', 'user_permissions', 'groups']


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'descripcion']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['sku', 'nombre', 'categoria', 'precio', 'stock', 'stock_minimo', 'bajo_stock', 'activo']
    list_filter = ['categoria', 'activo']
    search_fields = ['sku', 'nombre']
    readonly_fields = ['stock']  # el stock solo cambia con movimientos


class DetalleInline(admin.TabularInline):
    model = DetallePedido
    extra = 0
    readonly_fields = ['producto', 'sku', 'nombre', 'cantidad', 'precio_unitario', 'subtotal']


class HistorialInline(admin.TabularInline):
    model = HistorialEstado
    extra = 0
    readonly_fields = ['estado', 'fecha']


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ['id', 'usuario', 'estado', 'total', 'created_at']
    list_filter = ['estado']
    inlines = [DetalleInline, HistorialInline]
    readonly_fields = ['usuario', 'total', 'estado', 'idempotency_key']


@admin.register(MovimientoStock)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'producto', 'tipo', 'cantidad', 'stock_resultante', 'motivo']
    list_filter = ['tipo']
    search_fields = ['producto__nombre', 'motivo']
