import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useVuelo } from '../animacion/VueloCarrito.jsx';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, GitCompareArrows, LayoutDashboard, LogOut, Menu, Moon, Package, Search, ShoppingBag, ShoppingCart, Sun, User, X, Zap } from 'lucide-react';
import { Ayuda, EtiquetaMenu, MenuDesplegable, OpcionMenu, SeparadorMenu } from './Radix.jsx';
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
  const { rebote } = useVuelo();
  const navegar = useNavigate();
  // Primero salir de la página (si es privada, ya no hay nada que proteger) y luego borrar la sesión.
  // Al revés, la página privada alcanzaría a redirigir al login y recordaría volver a ella.
  const salir = () => { navegar('/'); logout(); setMenu(false); };

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
          {/* Abre la paleta de comandos (también con Ctrl+K / ⌘K) */}
          <button onClick={() => window.dispatchEvent(new Event('voltec:abrir-paleta'))} aria-label="Buscar (Ctrl+K)"
            className="hidden items-center gap-2 rounded-xl border border-borde bg-white/5 px-3 py-2 text-sm text-slate-400 hover:border-acento/60 hover:text-white md:flex">
            <Search className="h-4 w-4" aria-hidden />Buscar
            <kbd className="rounded border border-borde px-1.5 text-[10px] font-semibold text-slate-500">Ctrl K</kbd>
          </button>
          <div className="hidden xl:block"><SelectorApi /></div>
          {usuario ? (
            <div className="hidden sm:block">
              <MenuDesplegable disparador={
                <button className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm text-slate-300 hover:bg-white/5 data-[state=open]:bg-white/5" aria-label="Menú de usuario">
                  <User className="h-4 w-4 text-slate-500" aria-hidden />{usuario.nombre.split(' ')[0]}
                  {esAdmin && <span className="rounded-md bg-violeta/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violeta">admin</span>}
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                </button>
              }>
                <EtiquetaMenu>{usuario.email}</EtiquetaMenu>
                <OpcionMenu onSelect={() => navegar('/mis-pedidos')}><ShoppingBag className="h-4 w-4" />Mis pedidos</OpcionMenu>
                <OpcionMenu onSelect={() => navegar('/comparar')}><GitCompareArrows className="h-4 w-4" />Comparador</OpcionMenu>
                {esAdmin && <OpcionMenu onSelect={() => navegar('/admin')}><LayoutDashboard className="h-4 w-4" />Panel de administración</OpcionMenu>}
                <SeparadorMenu />
                <OpcionMenu peligro onSelect={salir}><LogOut className="h-4 w-4" />Cerrar sesión</OpcionMenu>
              </MenuDesplegable>
            </div>
          ) : (
            <Link to="/login" className="btn-secundario hidden sm:inline-flex">Ingresar</Link>
          )}
          <Ayuda texto={tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'}>
            <button className="rounded-xl border border-borde bg-white/5 p-2.5 hover:border-acento/60" onClick={alternar}
              aria-label={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={tema} className="block" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {tema === 'oscuro' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </Ayuda>
          <motion.button id="boton-carrito" key={`carrito-${rebote}`} animate={rebote ? { scale: [1, 1.18, 0.94, 1] } : undefined} transition={{ duration: 0.45 }}
            className="relative rounded-xl border border-borde bg-white/5 p-2.5 hover:border-acento/60" onClick={() => setAbierto(true)} aria-label={`Carrito, ${cantidadTotal} productos`}>
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence>
              {cantidadTotal > 0 && (
                <motion.span key={cantidadTotal} initial={{ scale: 0.4, y: -6 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-acento px-1 text-[11px] font-bold text-slate-950">{cantidadTotal}</motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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
              ? <button className="btn-secundario" onClick={salir}><LogOut className="h-4 w-4" />Salir</button>
              : <Link to="/login" className="btn-secundario" onClick={() => setMenu(false)}><Package className="h-4 w-4" />Ingresar</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
