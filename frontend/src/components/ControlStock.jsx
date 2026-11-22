import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useAjustarStock } from '../api/edicion.js';

// Botones rápidos de stock: cada clic registra un movimiento en el kardex (POST /stock/movimientos)
export default function ControlStock({ producto, extendido = false }) {
  const ajustar = useAjustarStock();
  const [cantidad, setCantidad] = useState('10');
  const [motivo, setMotivo] = useState('');
  const mover = (n, m) => ajustar.mutate({ producto, cantidad: n, motivo: m });
  const boton = 'inline-flex items-center justify-center gap-0.5 rounded-lg border border-borde px-2 py-1 text-xs font-semibold tabular-nums transition disabled:opacity-40';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5" role="group" aria-label={`Stock de ${producto.nombre}`}>
        <button className={`${boton} hover:border-red-400/60 hover:text-red-300`} disabled={producto.stock < 1} onClick={() => mover(-1)} aria-label="Quitar 1 unidad">
          <Minus className="h-3 w-3" />1
        </button>
        <span className="min-w-[3.5rem] text-center text-sm font-bold tabular-nums">{producto.stock} u</span>
        <button className={`${boton} hover:border-emerald-400/60 hover:text-emerald-300`} onClick={() => mover(1)} aria-label="Agregar 1 unidad"><Plus className="h-3 w-3" />1</button>
        <button className={`${boton} hover:border-emerald-400/60 hover:text-emerald-300`} onClick={() => mover(5)} aria-label="Agregar 5 unidades"><Plus className="h-3 w-3" />5</button>
      </div>
      {extendido && (
        <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => e.preventDefault()}>
          <input type="number" min="1" className="campo w-24 py-1.5" value={cantidad} onChange={(e) => setCantidad(e.target.value)} aria-label="Cantidad" />
          <input className="campo min-w-[10rem] flex-1 py-1.5" placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo" />
          <button className="btn-secundario py-1.5" disabled={!(Number(cantidad) > 0)} onClick={() => mover(Number(cantidad), motivo || 'Compra a proveedor')}>Entrada</button>
          <button className="btn-peligro py-1.5" disabled={!(Number(cantidad) > 0)} onClick={() => mover(-Number(cantidad), motivo || 'Merma')}>Salida</button>
        </form>
      )}
    </div>
  );
}
