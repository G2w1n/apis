# Django 5 + Django REST Framework + PostgreSQL

```
tienda/settings.py        Configuración (PostgreSQL, DRF, JWT, CORS)
api/
├── models.py             Modelos + restricción CHECK (stock >= 0) + máquina de estados
├── serializers.py        Validación de entrada y formato de salida
├── servicios.py          Lógica de negocio: transaction.atomic + select_for_update
├── views.py              Vistas (filtros traducidos a SQL por el ORM)
├── autenticacion.py      JWT con PyJWT
├── errores.py            Formato de error común
├── admin.py              Panel /admin/ (productos, pedidos, kardex)
└── management/commands/seed.py
```

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed
python manage.py runserver 8000          # o: gunicorn tienda.wsgi -b 0.0.0.0:8000 -w 4
```
Panel de administración: http://localhost:8000/admin/ (entra con `admin@tienda.pe` / `Admin123*`).
