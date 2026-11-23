import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GitCompareArrows, X } from 'lucide-react';
import { MAX_COMPARAR, useComparar } from '../context/CompararContext.jsx';
import ArteProducto from './ArteProducto.jsx';

// Barra flotante que aparece al marcar productos para comparar
export default function BarraComparar() {
  const { lista, quitar, vaciar } = useComparar();
  const { pathname } = useLocation();
  const visible = lista.length > 0 && pathname !== '/comparar';
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-20 z-40 flex justify-center sm:bottom-5">
      <AnimatePresence>
        {visible && (
          <motion.div layout initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto flex max-w-full items-center gap-3 rounded-2xl border border-violeta/40 bg-panel/95 p-2.5 pl-4 shadow-2xl backdrop-blur-xl">
            <GitCompareArrows className="hidden h-5 w-5 shrink-0 text-violeta sm:block" aria-hidden />
            <ul className="flex min-w-0 gap-2 overflow-x-auto">
              <AnimatePresence initial={false}>
                {lista.map((p) => (
                  <motion.li key={p.id} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-borde bg-white/5 py-1 pl-1 pr-2">
                    <ArteProducto producto={p} tamano="sm" />
                    <span className="max-w-[7rem] truncate text-xs font-medium">{p.nombre}</span>
                    <button onClick={() => quitar(p.id)} className="rounded p-0.5 text-slate-500 hover:text-white" aria-label={`Quitar ${p.nombre}`}><X className="h-3.5 w-3.5" /></button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <span className="hidden shrink-0 text-xs text-slate-500 md:block">{lista.length}/{MAX_COMPARAR}</span>
            <Link to="/comparar" className={`btn-primario shrink-0 ${lista.length < 2 ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={lista.length < 2}>
              Comparar
            </Link>
            <button onClick={vaciar} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Vaciar comparador"><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
