# Ruby on Rails 8 (API) + PostgreSQL

```
app/
├── models/               Active Record + máquina de estados (Pedido::TRANSICIONES)
├── controllers/          Controladores delgados; ApplicationController maneja JWT, errores y paginación
├── services/             Lógica de negocio: transaction + .lock (SELECT ... FOR UPDATE)
│   └── validador.rb      Validación estricta de tipos del JSON de entrada
└── errors/error_negocio.rb
config/routes.rb          Todas las rutas en un solo archivo
db/migrate/               Esquema con CHECK (stock >= 0) e índice único parcial para idempotencia
db/seeds.rb               Carga ../shared/seed.json
```

```bash
bundle install
bin/rails db:prepare db:seed
bin/rails server -p 3001
```
En producción: `RAILS_ENV=production SECRET_KEY_BASE=... bin/rails server` (activa `RAILS_FORCE_SSL=true` detrás de HTTPS).
