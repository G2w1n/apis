import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingCart, Truck } from 'lucide-react';
import { useProducto } from '../api/consultas.js';
import { useCarrito } from '../context/CarritoContext.jsx';
import ArteProducto from '../components/ArteProducto.jsx';
import { ErrorCaja, StockChip } from '../components/ui.jsx';
import { DetalleEsqueleto } from '../components/Esqueletos.jsx';
import { soles } from '../utils/formato.js';

export default function Producto() {
  const { id } = useParams();
  const { data: producto, isLoading, isError, error, refetch } = useProducto(id);
  const { agregar } = useCarrito();
  const [cantidad, setCantidad] = useState(1);

  if (isLoading) return <DetalleEsqueleto />;
  if (isError) return <div className="pt-10"><ErrorCaja error={error} reintentar={refetch} /></div>;

  return (
    <div className="pt-8">
      <Link to="/catalogo" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Volver al catálogo</Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="tarjeta p-4"><ArteProducto producto={producto} tamano="lg" /></div>
        <div className="animate-aparecer">
          <p className="text-sm font-medium uppercase tracking-wide text-acento">{producto.categoria?.nombre}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{producto.nombre}</h1>
          <p className="mt-1 text-sm text-slate-500">SKU {producto.sku}</p>
          <p className="mt-6 font-display text-4xl font-bold">{soles(producto.precio)}</p>
          <div className="mt-3 flex items-center gap-3"><StockChip producto={producto} /><span className="text-sm text-slate-400">{producto.stock} disponibles</span></div>
          <p className="mt-6 text-slate-300">{producto.descripcion || 'Sin descripción.'}</p>

          {producto.stock > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-borde">
                <button className="p-3 hover:text-acento" onClick={() => setCantidad(Math.max(1, cantidad - 1))} aria-label="Menos"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-semibold tabular-nums">{cantidad}</span>
                <button className="p-3 hover:text-acento" onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))} aria-label="Más"><Plus className="h-4 w-4" /></button>
              </div>
              <button className="btn-primario flex-1 py-3 text-base" onClick={() => agregar(producto, cantidad)}>
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
    </div>
  );
}
