import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Moon, Package, ShoppingCart, Sun, User, X, Zap } from 'lucide-react';
import { useTema } from '../context/TemaContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import SelectorApi from './SelectorApi.jsx';

const enlace = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white'}`;

export default function Navbar() {
  const { usuario, esAdmin, logout } = useAuth();
  const { cantidadTotal, setAbierto } = useCarrito();
  const [menu, setMenu] = useState(false);
  const { tema, alternar } = useTema();
  const navegar = useNavigate();

  const enlaces = (
    <>
      <NavLink to="/" end className={enlace} onClick={() => setMenu(false)}>Inicio</NavLink>
      <NavLink to="/catalogo" className={enlace} onClick={() => setMenu(false)}>Catálogo</NavLink>
      {usuario && <NavLink to="/mis-pedidos" className={enlace} onClick={() => setMenu(false)}>Mis pedidos</NavLink>}
      {esAdmin && (
        <NavLink to="/admin" className={enlace} onClick={() => setMenu(false)}>
          <LayoutDashboard className="mr-1 inline h-4 w-4" aria-hidden />Admin
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-borde/80 bg-fondo/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-acento to-violeta text-slate-950">
            <Zap className="h-5 w-5" fill="currentColor" aria-hidden />
          </span>
          VOLTEC
        </Link>
        <nav className="hidden items-center gap-1 md:flex">{enlaces}</nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:block"><SelectorApi /></div>
          {usuario ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex items-center gap-1.5 text-sm text-slate-300">
                <User className="h-4 w-4 text-slate-500" aria-hidden />{usuario.nombre.split(' ')[0]}
                {esAdmin && <span className="rounded-md bg-violeta/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violeta">admin</span>}
              </span>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => { logout(); navegar('/'); }} title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-secundario hidden sm:inline-flex">Ingresar</Link>
          )}
          <button className="rounded-xl border border-borde bg-white/5 p-2.5 hover:border-acento/60" onClick={alternar}
            aria-label={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} title={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}>
            {tema === 'oscuro' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="relative rounded-xl border border-borde bg-white/5 p-2.5 hover:border-acento/60" onClick={() => setAbierto(true)} aria-label={`Carrito, ${cantidadTotal} productos`}>
            <ShoppingCart className="h-5 w-5" />
            {cantidadTotal > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-acento px-1 text-[11px] font-bold text-slate-950">{cantidadTotal}</span>
            )}
          </button>
          <button className="rounded-lg p-2 md:hidden" onClick={() => setMenu(!menu)} aria-label="Menú">
            {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menu && (
        <div className="border-t border-borde px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">{enlaces}</nav>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SelectorApi />
            {usuario
              ? <button className="btn-secundario" onClick={() => { logout(); setMenu(false); }}><LogOut className="h-4 w-4" />Salir</button>
              : <Link to="/login" className="btn-secundario" onClick={() => setMenu(false)}><Package className="h-4 w-4" />Ingresar</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
