import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ArteProducto from './ArteProducto.jsx';
import { StockChip } from './ui.jsx';
import { soles } from '../utils/formato.js';
import { useCarrito } from '../context/CarritoContext.jsx';

export default function TarjetaProducto({ producto }) {
  const { agregar } = useCarrito();
  return (
    <article className="group tarjeta flex animate-aparecer flex-col p-3 transition duration-300 hover:-translate-y-1 hover:shadow-brillo">
      <Link to={`/producto/${producto.id}`} className="block" aria-label={producto.nombre}>
        <ArteProducto producto={producto} />
      </Link>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{producto.categoria?.nombre ?? 'General'}</span>
          <StockChip producto={producto} />
        </div>
        <Link to={`/producto/${producto.id}`} className="line-clamp-2 font-semibold leading-snug text-slate-100 hover:text-acento">
          {producto.nombre}
        </Link>
        <p className="mt-1 line-clamp-1 text-sm text-slate-400">{producto.descripcion}</p>
        <div className="mt-auto flex items-end justify-between pt-4">
          <span className="font-display text-xl font-bold">{soles(producto.precio)}</span>
          <button
            className="grid h-10 w-10 place-items-center rounded-xl bg-acento text-slate-950 transition hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-400"
            onClick={() => agregar(producto)}
            disabled={producto.stock === 0}
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
