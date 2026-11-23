import { Route, Routes, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CarritoDrawer from './components/CarritoDrawer.jsx';
import AvisoLento from './components/AvisoLento.jsx';
import ConsolaApi from './components/ConsolaApi.jsx';
import BarraComparar from './components/BarraComparar.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Inicio from './pages/Inicio.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Producto from './pages/Producto.jsx';
import Login from './pages/Login.jsx';
import MisPedidos from './pages/MisPedidos.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';
import { Cargando } from './components/ui.jsx';
import { useTema } from './context/TemaContext.jsx';

// La zona admin (y la librería de gráficos) se descarga solo cuando un administrador entra
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProductos = lazy(() => import('./pages/admin/Productos.jsx'));
const AdminPedidos = lazy(() => import('./pages/admin/Pedidos.jsx'));
const Inventario = lazy(() => import('./pages/admin/Inventario.jsx'));
const Concurrencia = lazy(() => import('./pages/admin/Concurrencia.jsx'));
const Auditoria = lazy(() => import('./pages/admin/Auditoria.jsx'));
// También se cargan bajo demanda: el checkout (formularios + confeti), el comparador, el comprobante y la paleta
const Checkout = lazy(() => import('./pages/checkout/Checkout.jsx'));
const Comparar = lazy(() => import('./pages/Comparar.jsx'));
const Comprobante = lazy(() => import('./pages/Comprobante.jsx'));
const Paleta = lazy(() => import('./components/Paleta.jsx'));

// Clave de la animación: cada página anima al entrar; las pestañas del admin cuentan como una sola página
const claveDePagina = (ruta) => (ruta.startsWith('/admin') ? '/admin' : ruta);

function Tienda() {
  const { pathname } = useLocation();
  const pagina = useOutlet();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Navbar />
      <AvisoLento />
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 pb-10 sm:px-6">
        {/* popLayout: la página nueva entra mientras la anterior sale, así la imagen compartida puede "viajar" */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={claveDePagina(pathname)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}>
            {/* Suspense DENTRO de la página animada: si una página se descarga bajo demanda,
                la espera no interrumpe la animación de salida de la anterior (que quedaría pegada) */}
            <Suspense fallback={<Cargando />}>{pagina}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CarritoDrawer />
      <ConsolaApi />
      <Suspense fallback={null}><Paleta /></Suspense>
      <BarraComparar />
    </>
  );
}

export default function App() {
  const { tema } = useTema();
  return (
    <>
      <Routes>
        <Route element={<Tienda />}>
          <Route index element={<Inicio />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="producto/:id" element={<Producto />} />
          <Route path="login" element={<Login />} />
          <Route path="comparar" element={<Comparar />} />
          <Route path="mis-pedidos" element={<RutaProtegida><MisPedidos /></RutaProtegida>} />
          <Route path="checkout" element={<RutaProtegida><Checkout /></RutaProtegida>} />
          <Route path="admin" element={<RutaProtegida soloAdmin><AdminLayout /></RutaProtegida>}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<AdminProductos />} />
            <Route path="pedidos" element={<AdminPedidos />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="concurrencia" element={<Concurrencia />} />
            <Route path="auditoria" element={<Auditoria />} />
          </Route>
          <Route path="*" element={<NoEncontrado />} />
        </Route>
        {/* Sin barra ni pie: página lista para imprimir */}
        <Route path="pedidos/:id/comprobante" element={<RutaProtegida><Suspense fallback={<Cargando />}><Comprobante /></Suspense></RutaProtegida>} />
      </Routes>
      <Toaster theme={tema === 'oscuro' ? 'dark' : 'light'} position="bottom-right" richColors closeButton />
    </>
  );
}
