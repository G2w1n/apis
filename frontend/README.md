# Voltec · Frontend en React

Tienda de tecnología que consume la API del proyecto. La API es **Express + Firebase**
(publicada en Render); el indicador de la barra superior muestra si está en línea.

**Stack:** React 18 · Vite · Tailwind CSS · React Router · TanStack Query · Recharts · lucide-react
· **Framer Motion** (animaciones) · **Radix UI** (menús y ventanas accesibles) · **cmdk** (paleta Ctrl+K)
· **React Hook Form + Zod** (formularios) · **Embla** (carrusel) · **React Three Fiber** (3D) · canvas-confetti

## Secciones
| Ruta | Qué hace | Acceso |
|---|---|---|
| `/` | Portada: hero, categorías, productos premium y últimas unidades | público |
| `/catalogo` | Búsqueda, filtros por categoría, precio y stock, orden y paginación (los filtros viven en la URL) | público |
| `/producto/:id` | Detalle y agregar al carrito | público |
| `/login` | Ingreso, registro y acceso rápido de demo | público |
| `/comparar` | Hasta 3 productos lado a lado (mejor precio, diferencia, stock) | público |
| `/checkout` | Envío → pago → revisión → confirmación con confeti | cliente |
| `/pedidos/:id/comprobante` | Comprobante imprimible / PDF | dueño o admin |
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

## Experiencia e interacción
| Qué | Cómo |
|---|---|
| **Transiciones entre páginas** | `AnimatePresence` + `useOutlet`; la imagen de un producto "viaja" del catálogo al detalle (`layoutId`) |
| **Aparición al hacer scroll** | Tarjetas escalonadas con `whileInView` |
| **Carrito animado** | La miniatura vuela hasta el ícono del carrito y el contador rebota |
| **Tarjetas con inclinación 3D** | Siguen el mouse con resortes (`useSpring`) y un brillo; desactivado en táctil |
| **Portada 3D** | Laptop hecha con primitivas en React Three Fiber; la tapa se abre y sigue al mouse. Se descarga aparte (~225 KB gzip), solo en pantallas grandes con WebGL |
| **Carrusel** | Embla: táctil, con autoplay que se pausa al pasar el mouse |
| **Paleta Ctrl+K** | Busca productos tolerando errores ("ipone" → iPhone), navega, cambia tema o API |
| **Comparador** | Barra flotante animada + tabla lado a lado con datos frescos de la API |
| **Checkout** | Pasos con barra de progreso, validación en vivo (Zod), tarjeta que gira al escribir el CVV, Luhn, confeti y comprobante |
| **Seguimiento en vivo** | "Mis pedidos" consulta cada 5 s y avisa cuando cambia el estado |
| **Dashboard** | KPIs que cuentan hasta su valor y barras que crecen |

**Accesibilidad y rendimiento**
- `MotionConfig reducedMotion="user"`: con "reducir movimiento" del sistema no hay desplazamientos, ni confeti, ni autoplay, y el 3D queda fijo.
- El checkout, la paleta, el comparador, el comprobante, el admin y el 3D se cargan **bajo demanda**.
- `Suspense` va **dentro** de cada página animada: si fuera afuera, la descarga de una página interrumpe la animación de salida de la anterior y esta queda pegada.
- `RutaProtegida` usa `useIsPresent`: una página que está saliendo no redirige al login (evita un bucle al cerrar sesión).
- El pago es simulado: el número de tarjeta y el CVV nunca salen del navegador; a la API solo van el método y los últimos 4 dígitos.

## Edición en vivo (admin)
- **Catálogo → "Modo edición":** clic en el precio de una tarjeta para cambiarlo (Enter guarda, Esc cancela) y botones **−1 / +1 / +5** de stock.
- **Detalle del producto:** el admin edita nombre, precio, descripción y stock mínimo haciendo clic, registra entradas/salidas con motivo
  y ve el **historial de cambios** (antes → después) que sale de `GET /auditoria`.
- **Actualización optimista:** el cambio se ve al instante; si la API lo rechaza, se deshace y se muestra el motivo.
- **Consola API** (botón abajo a la izquierda): muestra cada petición que hace la página — método, ruta, código, tiempo, lo enviado y la respuesta.
  Las contraseñas y tokens se ocultan. Ideal para mostrar en la exposición qué llega a la API.

## Seguridad en el navegador
Render envía cabeceras definidas en `render.yaml`:
- **Content-Security-Policy:** solo scripts propios; conexiones solo a la API y a Google Fonts; sin iframes (`frame-ancestors 'none'`).
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
