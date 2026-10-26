# Voltec · Frontend en React

Tienda de tecnología que consume la API del proyecto. Funciona con **cualquiera de las 3 APIs**
(Express + Firebase, Django o Rails) y se puede cambiar entre ellas en vivo desde el selector de la barra superior.

**Stack:** React 18 · Vite · Tailwind CSS · React Router · TanStack Query · Recharts · lucide-react

## Secciones
| Ruta | Qué hace | Acceso |
|---|---|---|
| `/` | Portada: hero, categorías, productos premium y últimas unidades | público |
| `/catalogo` | Búsqueda, filtros por categoría, precio y stock, orden y paginación (los filtros viven en la URL) | público |
| `/producto/:id` | Detalle y agregar al carrito | público |
| `/login` | Ingreso, registro y acceso rápido de demo | público |
| `/mis-pedidos` | Historial con seguimiento (pendiente → pagado → enviado → entregado) y cancelación | cliente |
| `/admin` | Dashboard con KPIs y gráficos | admin |
| `/admin/productos` | Crear, editar y retirar productos | admin |
| `/admin/pedidos` | Avanzar estados y cancelar pedidos | admin |
| `/admin/inventario` | Kardex, entradas/salidas y alertas de stock | admin |
| `/admin/concurrencia` | Demo en vivo: N compras simultáneas contra un stock pequeño | admin |
| `/admin/auditoria` | Quién cambió qué y cuándo (antes → después, IP) | admin |

## Ejecutar en tu PC
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```
En `localhost` el selector incluye las APIs locales (puertos 3000, 8000 y 3001) además de las de Render.

## Organización del código
```
src/
├── api/cliente.js       fetch + token JWT + errores de la API en un solo lugar
├── api/consultas.js     hooks de datos con caché (React Query); la API elegida es parte de la clave
├── context/             API elegida, sesión (una por API) y carrito (uno por API)
├── components/          barra, carrito lateral, tarjetas, selector de API, rutas protegidas
└── pages/               tienda y pages/admin (cargadas bajo demanda para que la tienda pese menos)
```

## Seguridad en el navegador
Render envía cabeceras definidas en `render.yaml`:
- **Content-Security-Policy:** solo scripts propios; conexiones solo a las 3 APIs y a Google Fonts; sin iframes (`frame-ancestors 'none'`).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS.
- Por eso el script del tema (`public/tema.js`) es un archivo y no código inline.

## Detalles que reflejan buenas prácticas
- **Modo claro/oscuro** con variables CSS: las escalas de Tailwind se invierten en modo claro (300 ↔ 700), sin duplicar estilos.
- **Skeletons** de carga en catálogo, detalle, pedidos y tablas del admin.
- **PWA:** se puede instalar en el celular; la API nunca se guarda en caché (precios y stock siempre reales).
- **Medidor de contraseña** con las mismas reglas que valida el servidor.
- **Auditoría** en el admin: quién cambió qué, con antes → después.
- **Idempotency-Key** en cada compra: un doble clic no crea dos pedidos.
- **Code splitting:** la zona admin y la librería de gráficos solo se descargan al entrar como admin (la tienda pesa ~90 KB gzip).
- **Aviso de "servidor despertando"** cuando la API de Render tarda más de 4 s (plan gratuito).
- Diseño **responsive** y accesible (etiquetas `aria`, foco visible, tablas además de gráficos).
