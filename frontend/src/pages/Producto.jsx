import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, PencilRuler, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { useProducto } from '../api/consultas.js';
import { useEditarProducto } from '../api/edicion.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ArteProducto from '../components/ArteProducto.jsx';
import CampoEditable from '../components/CampoEditable.jsx';
import ControlStock from '../components/ControlStock.jsx';
import HistorialProducto from '../components/HistorialProducto.jsx';
import { ErrorCaja, StockChip } from '../components/ui.jsx';
import { DetalleEsqueleto } from '../components/Esqueletos.jsx';
import { soles } from '../utils/formato.js';

export default function Producto() {
  const { id } = useParams();
  const { data: producto, isLoading, isError, error, refetch } = useProducto(id);
  const { agregar } = useCarrito();
  const { esAdmin } = useAuth();
  const editar = useEditarProducto();
  const [cantidad, setCantidad] = useState(1);
  const imagen = useRef(null);

  if (isLoading) return <DetalleEsqueleto />;
  if (isError) return <div className="pt-10"><ErrorCaja error={error} reintentar={refetch} /></div>;

  // Solo el admin ve los campos editables; para el cliente es una página normal
  const campo = (nombre, tipo, opciones = {}) => (
    <CampoEditable valor={producto[nombre]} tipo={tipo} etiqueta={opciones.etiqueta ?? nombre}
      formato={opciones.formato} className={opciones.className}
      guardando={editar.isPending && nombre in (editar.variables?.cambios ?? {})}
      alGuardar={(v) => editar.mutate({ id: producto.id, cambios: { [nombre]: v } })} />
  );

  return (
    <div className="pt-8">
      <Link to="/catalogo" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Volver al catálogo</Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="tarjeta p-4">
          {/* Mismo layoutId que la tarjeta: la imagen se anima desde el catálogo hasta aquí */}
          <motion.div ref={imagen} layoutId={`imagen-${producto.id}`}><ArteProducto producto={producto} tamano="lg" /></motion.div>
        </div>
        <div className="animate-aparecer">
          {esAdmin && (
            <p className="mb-4 flex items-center gap-2 rounded-xl border border-violeta/30 bg-violeta/10 px-3 py-2 text-xs text-violet-200">
              <PencilRuler className="h-4 w-4 shrink-0" aria-hidden />Eres admin: haz clic en cualquier dato para editarlo. Los cambios van directo a la API.
            </p>
          )}
          <p className="text-sm font-medium uppercase tracking-wide text-acento">{producto.categoria?.nombre}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {esAdmin ? campo('nombre', 'texto', { etiqueta: 'nombre' }) : producto.nombre}
          </h1>
          <p className="mt-1 text-sm text-slate-500">SKU {producto.sku}</p>
          <div className="mt-6 font-display text-4xl font-bold">
            {esAdmin ? campo('precio', 'precio', { formato: soles, etiqueta: 'precio' }) : soles(producto.precio)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StockChip producto={producto} />
            <span className="text-sm text-slate-400">{producto.stock} disponibles</span>
            {esAdmin && (
              <span className="flex items-center gap-1 text-sm text-slate-400">
                · mínimo {campo('stock_minimo', 'entero', { etiqueta: 'stock mínimo' })}
              </span>
            )}
          </div>
          <div className="mt-6 text-slate-300">
            {esAdmin
              ? campo('descripcion', 'multilinea', { etiqueta: 'descripción', formato: (v) => v || 'Sin descripción (clic para agregar)' })
              : producto.descripcion || 'Sin descripción.'}
          </div>

          {esAdmin && (
            <div className="mt-6 rounded-2xl border border-dashed border-violeta/40 bg-violeta/5 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-violeta">Stock · cada cambio queda en el kardex</p>
              <ControlStock producto={producto} extendido />
            </div>
          )}

          {producto.stock > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-borde">
                <button className="p-3 hover:text-acento" onClick={() => setCantidad(Math.max(1, cantidad - 1))} aria-label="Menos"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-semibold tabular-nums">{cantidad}</span>
                <button className="p-3 hover:text-acento" onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))} aria-label="Más"><Plus className="h-4 w-4" /></button>
              </div>
              <button className="btn-primario flex-1 py-3 text-base" onClick={() => agregar(producto, cantidad, imagen.current)}>
                <ShoppingCart className="h-5 w-5" />Agregar al carrito
              </button>
            </div>
          )}

          <ul className="mt-8 space-y-3 border-t border-borde pt-6 text-sm text-slate-400">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-acento" />Envío con seguimiento de estado</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-acento" />Stock garantizado al confirmar el pedido</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-acento" />Cancela gratis mientras no se haya enviado</li>
          </ul>
        </div>
      </div>
      {esAdmin && <HistorialProducto productoId={producto.id} />}
    </div>
  );
}
