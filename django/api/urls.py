from django.urls import path

from . import views

urlpatterns = [
    path('health', views.salud),
    path('auth/register', views.registro),
    path('auth/login', views.login),
    path('auth/me', views.yo),
    path('categorias', views.categorias),
    path('productos', views.productos),
    path('productos/<str:pk>', views.producto_detalle),
    path('pedidos', views.pedidos),
    path('pedidos/<str:pk>', views.pedido_detalle),
    path('pedidos/<str:pk>/estado', views.pedido_estado),
    path('pedidos/<str:pk>/cancelar', views.pedido_cancelar),
    path('stock/movimientos', views.movimientos),
    path('stock/alertas', views.alertas),
    path('stock/reporte', views.reporte),
    path('auditoria', views.auditoria),
]
