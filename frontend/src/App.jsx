import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CarritoDrawer from './components/CarritoDrawer.jsx';
import AvisoLento from './components/AvisoLento.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import Inicio from './pages/Inicio.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Producto from './pages/Producto.jsx';
import Login from './pages/Login.jsx';
import MisPedidos from './pages/MisPedidos.jsx';
import NoEncontrado from './pages/NoEncontrado.jsx';
import { Cargando } from './components/ui.jsx';

// La zona admin (y la librería de gráficos) se descarga solo cuando un administrador entra
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminProductos = lazy(() => import('./pages/admin/Productos.jsx'));
const AdminPedidos = lazy(() => import('./pages/admin/Pedidos.jsx'));
const Inventario = lazy(() => import('./pages/admin/Inventario.jsx'));
const Concurrencia = lazy(() => import('./pages/admin/Concurrencia.jsx'));

function Tienda() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Navbar />
      <AvisoLento />
      <main className="mx-auto min-h-[70vh] max-w-7xl px-4 pb-10 sm:px-6">
        <Suspense fallback={<Cargando />}><Outlet /></Suspense>
      </main>
      <Footer />
      <CarritoDrawer />
    </>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Tienda />}>
          <Route index element={<Inicio />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="producto/:id" element={<Producto />} />
          <Route path="login" element={<Login />} />
          <Route path="mis-pedidos" element={<RutaProtegida><MisPedidos /></RutaProtegida>} />
          <Route path="admin" element={<RutaProtegida soloAdmin><AdminLayout /></RutaProtegida>}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<AdminProductos />} />
            <Route path="pedidos" element={<AdminPedidos />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="concurrencia" element={<Concurrencia />} />
          </Route>
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
      <Toaster theme="dark" position="bottom-right" richColors closeButton />
    </>
  );
}
