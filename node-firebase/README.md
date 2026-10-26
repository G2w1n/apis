# Express 5 + Firebase (Firestore)

API de la tienda con **Node.js + Express**, desplegable como **Cloud Function** de Firebase y con **Firestore** como base de datos NoSQL.
El panel web (`public/`) se publica en **Firebase Hosting**.

```
functions/
├── index.js              Exporta la app como Cloud Function (onRequest)
├── src/
│   ├── app.js            Express: middlewares y rutas
│   ├── server.js         Servidor standalone (desarrollo y benchmark)
│   ├── firebase.js       Inicialización de Firestore y colecciones
│   ├── schemas.js        Validación con Zod
│   ├── routes/           Rutas HTTP (delgadas)
│   ├── services/         Lógica de negocio y transacciones
│   ├── middleware/       JWT, roles, validación, errores
│   └── utils/            Dinero en céntimos, paginación, cola por producto
└── scripts/seed.js       Carga ../shared/seed.json
public/index.html         Panel web (funciona con las 3 APIs)
firestore.rules           Acceso directo desde el navegador bloqueado: todo pasa por la API
```

## Ejecutar con el emulador
```bash
npm install -g firebase-tools
cd functions && npm install
firebase emulators:start --only firestore --project demo-tienda   # consola: http://localhost:4000
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm start # http://localhost:3000/api/v1
```
O la suite completa (Functions + Hosting + Firestore), igual que en producción:
```bash
npm run emuladores      # dentro de functions/ · panel: http://localhost:5000 · API: http://localhost:5000/api/v1
```

## Proyecto en la nube
- Proyecto: **`apip-e0b09`** · región: **southamerica-east1** (São Paulo).
- Los emuladores usan el proyecto ficticio `demo-tienda`, así nunca tocan tus datos reales.
- Para usar Firestore real desde tu PC, guarda la clave de la cuenta de servicio como `functions/serviceAccount.json` (ignorada por git).
- Despliegue y opción sin Blaze: ver el [README principal](../README.md#desplegar-en-firebase-proyecto-apip-e0b09).

## Decisiones de diseño en Firestore
- **Sin `UNIQUE`:** se crean documentos "candado" (`_unicos/sku:LAP-001`, `_unicos/email:...`) dentro de la transacción; `create()` falla si ya existen.
- **Sin `JOIN`:** los items e historial del pedido van embebidos, y el nombre de la categoría se copia dentro del producto.
- **Transacciones optimistas:** Firestore reintenta si dos transacciones chocan. Para evitar el "documento caliente",
  `utils/candado.js` encola en cada instancia las operaciones sobre el mismo producto (2 → ~150 pedidos/s).
- **Filtros en memoria:** Firestore no tiene búsqueda por texto ni varios rangos por consulta. Para un catálogo grande se usaría Algolia o Typesense.
