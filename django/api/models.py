from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models import Q


class UsuarioManager(BaseUserManager):
    def create_user(self, email, password, **extra):
        usuario = self.model(email=self.normalize_email(email).lower(), **extra)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_superuser(self, email, password, **extra):
        return self.create_user(email, password, rol=Usuario.Rol.ADMIN, is_staff=True, is_superuser=True, **extra)


class Usuario(AbstractUser):
    """Usuario que inicia sesión con email. Extiende el usuario de Django para usar su panel admin."""

    class Rol(models.TextChoices):
        ADMIN = 'admin'
        CLIENTE = 'cliente'

    username = None
    first_name = None
    last_name = None
    nombre = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    rol = models.CharField(max_length=10, choices=Rol.choices, default=Rol.CLIENTE)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']
    objects = UsuarioManager()

    def __str__(self):
        return self.email


class Categoria(models.Model):
    nombre = models.CharField(max_length=60, unique=True)
    descripcion = models.CharField(max_length=300, blank=True, default='')

    class Meta:
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    sku = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, default='')
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0)
    categoria = models.ForeignKey(Categoria, null=True, blank=True, on_delete=models.SET_NULL, related_name='productos')
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            # Última línea de defensa: aunque el código fallara, PostgreSQL rechaza stock negativo
            models.CheckConstraint(condition=Q(stock__gte=0), name='stock_no_negativo'),
            models.CheckConstraint(condition=Q(precio__gt=0), name='precio_positivo'),
        ]
        indexes = [models.Index(fields=['activo', 'nombre'])]

    @property
    def bajo_stock(self):
        return self.stock <= self.stock_minimo

    def __str__(self):
        return f'{self.sku} - {self.nombre}'


class Pedido(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'pendiente'
        PAGADO = 'pagado'
        ENVIADO = 'enviado'
        ENTREGADO = 'entregado'
        CANCELADO = 'cancelado'

    # Máquina de estados: transiciones permitidas desde cada estado
    TRANSICIONES = {
        'pendiente': ['pagado', 'cancelado'],
        'pagado': ['enviado', 'cancelado'],
        'enviado': ['entregado'],
        'entregado': [],
        'cancelado': [],
    }

    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name='pedidos')
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    idempotency_key = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'idempotency_key'], name='idempotencia_por_usuario',
                                    condition=Q(idempotency_key__isnull=False)),
        ]

    def __str__(self):
        return f'Pedido #{self.pk} ({self.estado})'


class DetallePedido(models.Model):
    """Copia los datos del producto al momento de la compra (si cambia el precio, el pedido no cambia)."""
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    sku = models.CharField(max_length=30)
    nombre = models.CharField(max_length=120)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['id']


class HistorialEstado(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='historial')
    estado = models.CharField(max_length=10, choices=Pedido.Estado.choices)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['fecha', 'id']


class MovimientoStock(models.Model):
    """Kardex: cada cambio de stock queda registrado con el saldo resultante."""

    class Tipo(models.TextChoices):
        ENTRADA = 'entrada'
        SALIDA = 'salida'

    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, related_name='movimientos')
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    cantidad = models.PositiveIntegerField()
    stock_resultante = models.IntegerField()
    motivo = models.CharField(max_length=200)
    pedido = models.ForeignKey(Pedido, null=True, blank=True, on_delete=models.SET_NULL, related_name='movimientos')
    usuario = models.ForeignKey(Usuario, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        indexes = [models.Index(fields=['producto', '-created_at'])]
