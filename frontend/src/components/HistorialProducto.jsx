import { ArrowRight, History } from 'lucide-react';
import { useAuditoria } from '../api/consultas.js';
import { fecha, soles } from '../utils/formato.js';

const NOMBRES = { precio: 'Precio', nombre: 'Nombre', descripcion: 'Descripción', stock_minimo: 'Stock mínimo', sku: 'SKU', imagen_url: 'Imagen', categoria_id: 'Categoría' };
const mostrar = (campo, v) => (v === null || v === undefined || v === '' ? '—' : campo === 'precio' ? soles(v) : String(v));

function Evento({ r }) {
  const d = r.detalle ?? {};
  if (r.accion === 'producto.actualizar') {
    return Object.entries(d.cambios ?? {}).map(([campo, { antes, despues }]) => (
      <span key={campo} className="flex flex-wrap items-center gap-1.5">
        <b className="font-medium text-slate-300">{NOMBRES[campo] ?? campo}:</b>
        <span className="text-red-300 line-through decoration-red-400/50">{mostrar(campo, antes)}</span>
        <ArrowRight className="h-3 w-3 text-slate-500" aria-hidden />
        <span className="text-emerald-300">{mostrar(campo, despues)}</span>
      </span>
    ));
  }
  if (r.accion === 'stock.movimiento') {
    return <span><b className={`font-medium ${d.tipo === 'entrada' ? 'text-emerald-300' : 'text-red-300'}`}>{d.tipo === 'entrada' ? '+' : '−'}{d.cantidad} u</b> → saldo {d.stock_resultante} · {d.motivo}</span>;
  }
  if (r.accion === 'producto.crear') return <span>Producto creado · {soles(d.precio)} · stock {d.stock}</span>;
  if (r.accion === 'producto.eliminar') return <span className="text-red-300">Retirado del catálogo</span>;
  return <span>{r.accion}</span>;
}

// Línea de tiempo con cada cambio del producto (sale de GET /auditoria) — solo admin
export default function HistorialProducto({ productoId }) {
  const historial = useAuditoria({ entidad: 'producto', entidad_id: productoId, limit: 15 });
  const registros = historial.data?.data ?? [];
  return (
    <section className="tarjeta mt-10 p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-violeta" aria-hidden />Historial de cambios</h2>
      {historial.isLoading ? <p className="text-sm text-slate-500">Cargando…</p>
        : registros.length === 0 ? <p className="text-sm text-slate-500">Sin cambios registrados.</p>
        : (
          <ol className="relative space-y-4 border-l border-borde pl-5">
            {registros.map((r) => (
              <li key={r.id} className="relative">
                <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-violeta ring-4 ring-panel" aria-hidden />
                <div className="space-y-0.5 text-sm text-slate-400"><Evento r={r} /></div>
                <p className="mt-0.5 text-xs text-slate-500">{fecha(r.created_at)} · {r.usuario_email ?? 'sistema'}</p>
              </li>
            ))}
          </ol>
        )}
    </section>
  );
}
