import { NavLink, Outlet } from 'react-router-dom';
import { Boxes, ClipboardList, LayoutDashboard, Package, Zap } from 'lucide-react';

const SECCIONES = [
  { a: '/admin', texto: 'Dashboard', icono: LayoutDashboard, fin: true },
  { a: '/admin/productos', texto: 'Productos', icono: Package },
  { a: '/admin/pedidos', texto: 'Pedidos', icono: ClipboardList },
  { a: '/admin/inventario', texto: 'Inventario', icono: Boxes },
  { a: '/admin/concurrencia', texto: 'Demo concurrencia', icono: Zap },
];

export default function AdminLayout() {
  return (
    <div className="pt-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-violeta">Panel de administración</p>
          <h1 className="font-display text-3xl font-bold">Voltec Admin</h1>
        </div>
      </div>
      <nav className="mb-8 flex gap-1 overflow-x-auto rounded-2xl border border-borde bg-panel/60 p-1.5" aria-label="Secciones de administración">
        {SECCIONES.map(({ a, texto, icono: Icono, fin }) => (
          <NavLink key={a} to={a} end={fin}
            className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Icono className="h-4 w-4" aria-hidden />{texto}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
