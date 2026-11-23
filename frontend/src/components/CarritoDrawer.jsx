import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import { soles } from '../utils/formato.js';
import ArteProducto from './ArteProducto.jsx';

export default function CarritoDrawer() {
  const carrito = useCarrito();
  const { usuario } = useAuth();
  const navegar = useNavigate();

  return (
    <AnimatePresence>
      {carrito.abierto && (
    <motion.div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito" initial="cerrado" animate="abierto" exit="cerrado">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => carrito.setAbierto(false)}
        variants={{ cerrado: { opacity: 0 }, abierto: { opacity: 1 } }} />
      {/* El panel entra deslizándose desde la derecha con un resorte */}
      <motion.aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-borde bg-panel"
        variants={{ cerrado: { x: '100%' }, abierto: { x: 0 } }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
        <header className="flex items-center justify-between border-b border-borde px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ShoppingBag className="h-5 w-5 text-acento" />Tu carrito</h2>
          <button className="rounded-lg p-2 hover:bg-white/5" onClick={() => carrito.setAbierto(false)} aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </header>

        {carrito.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
            <ShoppingBag className="h-12 w-12 text-slate-600" />
            <p>Tu carrito está vacío</p>
            <Link to="/catalogo" className="btn-primario" onClick={() => carrito.setAbierto(false)}>Ver catálogo</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto p-5">
              <AnimatePresence initial={false}>
              {carrito.items.map(({ producto, cantidad }) => (
                <motion.li key={producto.id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                  className="flex gap-3 overflow-hidden rounded-xl border border-borde bg-white/[.02] p-3">
                  <ArteProducto producto={producto} tamano="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{producto.nombre}</p>
                    <p className="text-sm text-slate-400">{soles(producto.precio)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="rounded-md border border-borde p-1 hover:border-acento" onClick={() => carrito.cambiarCantidad(producto.id, cantidad - 1)} aria-label="Quitar uno"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                      <button className="rounded-md border border-borde p-1 hover:border-acento" onClick={() => carrito.cambiarCantidad(producto.id, cantidad + 1)} aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                      <button className="ml-auto rounded-md p-1 text-slate-500 hover:text-red-400" onClick={() => carrito.quitar(producto.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </motion.li>
              ))}
              </AnimatePresence>
            </ul>
            <footer className="space-y-3 border-t border-borde p-5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total</span>
                <span className="font-display text-2xl font-bold">{soles(carrito.total)}</span>
              </div>
              {usuario ? (
                <button className="btn-primario w-full py-3" onClick={() => { carrito.setAbierto(false); navegar('/checkout'); }}>
                  Ir a pagar
                </button>
              ) : (
                <Link to="/login" state={{ desde: '/checkout' }} className="btn-primario w-full py-3" onClick={() => carrito.setAbierto(false)}>Inicia sesión para comprar</Link>
              )}
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />Protegido contra pedidos duplicados por doble clic
              </p>
            </footer>
          </>
        )}
      </motion.aside>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
