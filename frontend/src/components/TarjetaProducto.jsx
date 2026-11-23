import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompareArrows, Plus } from 'lucide-react';
import ArteProducto from './ArteProducto.jsx';
import CampoEditable from './CampoEditable.jsx';
import ControlStock from './ControlStock.jsx';
import { StockChip } from './ui.jsx';
import { soles } from '../utils/formato.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useComparar } from '../context/CompararContext.jsx';
import { useEditarProducto } from '../api/edicion.js';
import useInclinacion from '../animacion/useInclinacion.js';

// editable = modo edición del admin: precio y stock se cambian aquí mismo contra la API
export default function TarjetaProducto({ producto, editable = false }) {
  const { agregar } = useCarrito();
  const comparar = useComparar();
  const editar = useEditarProducto();
  const imagen = useRef(null);
  // En modo edición la tarjeta no se inclina (molestaría al escribir)
  const { estilo, eventos, brillo } = useInclinacion({ activo: !editable });
  const guardandoPrecio = editar.isPending && editar.variables?.id === producto.id;
  const enComparador = comparar.incluye(producto.id);

  return (
    <motion.article style={estilo} {...eventos}
      className={`group tarjeta relative flex h-full flex-col p-3 transition-shadow duration-300 [transform-style:preserve-3d] ${editable ? 'ring-1 ring-violeta/30' : 'hover:shadow-brillo'}`}>
      {brillo && <motion.div aria-hidden style={{ background: brillo }} className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />}
      <Link to={`/producto/${producto.id}`} className="block" aria-label={producto.nombre}>
        {/* layoutId: la imagen "viaja" desde la tarjeta hasta la página de detalle */}
        <motion.div ref={imagen} layoutId={`imagen-${producto.id}`} className="[transform:translateZ(30px)]">
          <ArteProducto producto={producto} />
        </motion.div>
      </Link>
      <button type="button" onClick={() => comparar.alternar(producto)} aria-pressed={enComparador}
        title={enComparador ? 'Quitar del comparador' : 'Agregar al comparador'}
        className={`absolute right-5 top-5 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold backdrop-blur transition ${enComparador ? 'bg-violeta text-white' : 'bg-black/40 text-slate-200 opacity-0 hover:bg-black/60 focus-visible:opacity-100 group-hover:opacity-100'}`}>
        <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />{enComparador ? 'Comparando' : 'Comparar'}
      </button>
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
          <motion.button whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-acento text-slate-950 transition-colors hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-400"
            onClick={() => agregar(producto, 1, imagen.current)}
            disabled={producto.stock === 0}
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            <Plus className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
