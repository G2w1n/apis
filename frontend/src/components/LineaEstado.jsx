import { Check, X } from 'lucide-react';
import { FLUJO, ESTADOS, fecha } from '../utils/formato.js';

// Seguimiento visual del pedido: pendiente → pagado → enviado → entregado
export default function LineaEstado({ pedido }) {
  const cancelado = pedido.estado === 'cancelado';
  const fechas = Object.fromEntries(pedido.historial.map((h) => [h.estado, h.fecha]));
  const actual = FLUJO.indexOf(pedido.estado);
  if (cancelado) {
    return (
      <p className="flex items-center gap-2 text-sm text-red-300">
        <X className="h-4 w-4" />Cancelado el {fecha(fechas.cancelado)} · el stock fue devuelto
      </p>
    );
  }
  return (
    <ol className="grid grid-cols-4 gap-2">
      {FLUJO.map((estado, i) => {
        const hecho = i <= actual;
        return (
          <li key={estado} className="flex flex-col gap-2">
            <div className={`h-1.5 rounded-full ${hecho ? 'bg-gradient-to-r from-acento to-violeta' : 'bg-slate-800'}`} />
            <div className="flex items-center gap-1.5 text-xs">
              {hecho && <Check className="h-3.5 w-3.5 text-acento" aria-hidden />}
              <span className={hecho ? 'font-semibold text-slate-200' : 'text-slate-500'}>{ESTADOS[estado].texto}</span>
            </div>
            {fechas[estado] && <span className="text-[11px] text-slate-500">{fecha(fechas[estado])}</span>}
          </li>
        );
      })}
    </ol>
  );
}
