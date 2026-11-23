import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, GitCompareArrows, ShoppingCart, X } from 'lucide-react';
import { useComparar } from '../context/CompararContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useBackend } from '../context/ApiContext.jsx';
import ArteProducto from '../components/ArteProducto.jsx';
import { StockChip, Vacio } from '../components/ui.jsx';
import { soles } from '../utils/formato.js';

export default function Comparar() {
  const { lista, quitar } = useComparar();
  const { api } = useAuth();
  const { backend } = useBackend();
  const { agregar } = useCarrito();
  const imagenes = useRef({});

  // Datos frescos de cada producto (precio y stock pueden haber cambiado desde que se marcó)
  const consultas = useQueries({
    queries: lista.map((p) => ({
      queryKey: [backend.id, 'anonimo', 'producto', String(p.id)],
      queryFn: async () => (await api('GET', `/productos/${p.id}`)).datos,
    })),
  });
  const productos = consultas.map((c, i) => c.data ?? { ...lista[i], cargando: c.isLoading, error: c.isError });
  const validos = productos.filter((p) => typeof p.precio === 'number');
  const minimo = Math.min(...validos.map((p) => p.precio));
  const maximoStock = Math.max(...validos.map((p) => p.stock));

  if (lista.length === 0) {
    return (
      <div className="pt-12">
        <Vacio titulo="No hay productos para comparar" texto="En el catálogo pasa el mouse por un producto y pulsa “Comparar” (hasta 3)."
          accion={<Link to="/catalogo" className="btn-primario">Ir al catálogo</Link>} />
      </div>
    );
  }

  const filas = [
    { titulo: 'Precio', valor: (p) => (
      <span className="flex items-center gap-2 font-display text-2xl font-bold">
        {soles(p.precio)}
        {validos.length > 1 && p.precio === minimo && <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300"><Crown className="h-3 w-3" />Mejor precio</span>}
      </span>) },
    { titulo: 'Diferencia', valor: (p) => (p.precio === minimo ? <span className="text-slate-500">—</span> : <span className="text-amber-300">+{soles(p.precio - minimo)} ({Math.round(((p.precio - minimo) / minimo) * 100)}%)</span>) },
    { titulo: 'Categoría', valor: (p) => p.categoria?.nombre ?? '—' },
    { titulo: 'Disponibilidad', valor: (p) => <span className="flex items-center gap-2"><StockChip producto={p} /><span className="text-sm text-slate-400">{p.stock} u{validos.length > 1 && p.stock === maximoStock ? ' · más stock' : ''}</span></span> },
    { titulo: 'Características', valor: (p) => <span className="text-sm text-slate-300">{p.descripcion || '—'}</span> },
    { titulo: 'SKU', valor: (p) => <span className="font-mono text-xs text-slate-500">{p.sku}</span> },
  ];

  return (
    <div className="pt-8">
      <h1 className="flex items-center gap-3 font-display text-3xl font-bold sm:text-4xl"><GitCompareArrows className="h-8 w-8 text-violeta" />Comparador</h1>
      <p className="mb-8 mt-1 text-slate-400">Precios y stock actualizados al momento desde la API.</p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] gap-4" style={{ gridTemplateColumns: `9rem repeat(${productos.length}, minmax(0, 1fr))` }}>
          <div />
          <AnimatePresence initial={false}>
            {productos.map((p) => (
              <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="tarjeta relative p-3">
                <button onClick={() => quitar(p.id)} className="absolute right-2 top-2 z-10 rounded-lg bg-black/40 p-1 text-slate-300 hover:text-white" aria-label={`Quitar ${p.nombre}`}><X className="h-4 w-4" /></button>
                <div ref={(el) => { imagenes.current[p.id] = el; }}><ArteProducto producto={p} /></div>
                <Link to={`/producto/${p.id}`} className="mt-3 line-clamp-2 block font-semibold hover:text-acento">{p.nombre}</Link>
              </motion.div>
            ))}
          </AnimatePresence>
          {filas.map((fila) => (
            <div key={fila.titulo} className="contents">
              <div className="self-center text-xs font-semibold uppercase tracking-wide text-slate-500">{fila.titulo}</div>
              {productos.map((p) => (
                <motion.div layout key={`${fila.titulo}-${p.id}`} className="self-center border-t border-borde/60 pt-3">
                  {p.cargando ? <span className="text-slate-500">…</span> : p.error ? <span className="text-red-300">No disponible</span> : fila.valor(p)}
                </motion.div>
              ))}
            </div>
          ))}
          <div />
          {productos.map((p) => (
            <motion.div layout key={`comprar-${p.id}`}>
              <button className="btn-primario w-full" disabled={!(p.stock > 0)} onClick={() => agregar(p, 1, imagenes.current[p.id])}>
                <ShoppingCart className="h-4 w-4" />{p.stock > 0 ? 'Agregar' : 'Agotado'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
