"""python manage.py seed — borra todo y carga ../shared/seed.json (los mismos datos que Express y Rails)."""
import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from api import servicios
from api.models import Categoria, DetallePedido, HistorialEstado, MovimientoStock, Pedido, Producto, Usuario


class Command(BaseCommand):
    help = 'Carga los datos de ejemplo compartidos'

    def add_arguments(self, parser):
        parser.add_argument('--si-vacio', action='store_true',
                            help='Solo carga datos si no hay usuarios (para ejecutarlo en cada arranque en la nube)')

    @transaction.atomic
    def handle(self, *args, **options):
        seed = json.loads((Path(settings.BASE_DIR).parent / 'shared' / 'seed.json').read_text(encoding='utf-8'))
        if options['si_vacio'] and Usuario.objects.exists():
            # Base ya cargada: solo se asignan las imágenes de ejemplo a los productos que aún no tienen una
            asignadas = sum(
                Producto.objects.filter(sku=p['sku'], imagen_url__isnull=True).update(imagen_url=p['imagen_url'])
                for p in seed['productos'] if p.get('imagen_url'))
            self.stdout.write(f'La base ya tiene datos: no se ejecuta el seed (imágenes asignadas: {asignadas})')
            return
        for modelo in (MovimientoStock, DetallePedido, HistorialEstado, Pedido, Producto, Categoria, Usuario):
            modelo.objects.all().delete()

        for u in seed['usuarios']:
            crear = Usuario.objects.create_superuser if u['rol'] == 'admin' else Usuario.objects.create_user
            crear(email=u['email'], password=u['password'], nombre=u['nombre'])
        admin = Usuario.objects.get(email='admin@tienda.pe')
        categorias = {c['nombre']: Categoria.objects.create(**c) for c in seed['categorias']}
        for p in seed['productos']:
            datos = {**p, 'categoria_id': categorias[p.pop('categoria')].id}
            datos.pop('categoria', None)
            servicios.crear_producto(datos, admin)

        self.stdout.write(self.style.SUCCESS(
            f"Seed listo: {len(seed['usuarios'])} usuarios, {len(seed['categorias'])} categorías, "
            f"{len(seed['productos'])} productos"))
