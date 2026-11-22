import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ArteProducto from './ArteProducto.jsx';
import CampoEditable from './CampoEditable.jsx';
import ControlStock from './ControlStock.jsx';
import { StockChip } from './ui.jsx';
import { soles } from '../utils/formato.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useEditarProducto } from '../api/edicion.js';

// editable = modo edición del admin: precio y stock se cambian aquí mismo contra la API
export default function TarjetaProducto({ producto, editable = false }) {
  const { agregar } = useCarrito();
  const editar = useEditarProducto();
  const guardandoPrecio = editar.isPending && editar.variables?.id === producto.id;

  return (
    <article className={`group tarjeta flex animate-aparecer flex-col p-3 transition duration-300 ${editable ? 'ring-1 ring-violeta/30' : 'hover:-translate-y-1 hover:shadow-brillo'}`}>
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

        {editable && (
          <div className="mt-3 rounded-xl border border-dashed border-violeta/40 bg-violeta/5 p-2.5">
            <ControlStock producto={producto} />
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          {editable ? (
            <CampoEditable valor={producto.precio} tipo="precio" formato={soles} etiqueta={`precio de ${producto.nombre}`}
              className="font-display text-xl font-bold" guardando={guardandoPrecio}
              alGuardar={(precio) => editar.mutate({ id: producto.id, cambios: { precio } })} />
          ) : (
            <span className="font-display text-xl font-bold">{soles(producto.precio)}</span>
          )}
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-acento text-slate-950 transition hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-400"
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
