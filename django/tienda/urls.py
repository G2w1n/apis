from django.contrib import admin
from django.urls import include, path, re_path

from api.views import inicio, ruta_no_encontrada, salud

urlpatterns = [
    path('', inicio),
    path('admin/', admin.site.urls),  # panel de administración incluido gratis con Django
    path('health', salud),
    path('api/v1/', include('api.urls')),
    re_path(r'^.*$', ruta_no_encontrada),
]
