import { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { useAuditoria } from '../../api/consultas.js';
import { ErrorCaja, Paginacion, Vacio } from '../../components/ui.jsx';
import { FilasEsqueleto } from '../../components/Esqueletos.jsx';
import { fecha, idCorto } from '../../utils/formato.js';

const ACCIONES = {
  'producto.crear': { texto: 'Producto creado', clase: 'bg-emerald-400/15 text-emerald-300' },
  'producto.actualizar': { texto: 'Producto editado', clase: 'bg-sky-400/15 text-sky-300' },
  'producto.eliminar': { texto: 'Producto retirado', clase: 'bg-red-400/15 text-red-300' },
  'stock.movimiento': { texto: 'Movimiento de stock', clase: 'bg-violet-400/15 text-violet-300' },
  'pedido.estado': { texto: 'Estado de pedido', clase: 'bg-cyan-400/15 text-cyan-300' },
  'pedido.cancelar': { texto: 'Pedido cancelado', clase: 'bg-amber-400/15 text-amber-300' },
  'categoria.crear': { texto: 'Categoría creada', clase: 'bg-emerald-400/15 text-emerald-300' },
  'auth.bloqueo': { texto: 'Login bloqueado', clase: 'bg-red-500/20 text-red-300' },
};

const valor = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

// Convierte el JSON de "detalle" en algo legible para una persona
function Detalle({ registro: r }) {
  const d = r.detalle ?? {};
  if (r.accion === 'producto.actualizar' && d.cambios) {
    return (
      <ul className="space-y-0.5">
        {Object.entries(d.cambios).map(([campo, { antes, despues }]) => (
          <li key={campo} className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500">{campo}:</span>
            <span className="text-red-300 line-through decoration-red-400/50">{valor(antes)}</span>
            <ArrowRight className="h-3 w-3 text-slate-500" aria-hidden />
            <span className="text-emerald-300">{valor(despues)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (r.accion === 'pedido.estado' || r.accion === 'pedido.cancelar') return <span>{d.de} <ArrowRight className="inline h-3 w-3" aria-hidden /> {d.a}</span>;
  if (r.accion === 'stock.movimiento') return <span>{d.tipo === 'entrada' ? '+' : '−'}{d.cantidad} · saldo {d.stock_resultante} · {d.motivo}</span>;
  if (r.accion === 'auth.bloqueo') return <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-red-300" />{d.email} · {d.minutos} min</span>;
  return <span>{[d.sku, d.nombre].filter(Boolean).join(' · ') || '—'}</span>;
}

export default function Auditoria() {
  const [filtros, setFiltros] = useState({ entidad: '', accion: '', page: 1 });
  const registros = useAuditoria({ ...filtros, limit: 20 });
  const cambiar = (c) => setFiltros({ ...filtros, page: 1, ...c });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold">Registro de auditoría</h2>
          <p className="text-sm text-slate-400">Quién cambió qué y cuándo. Se guarda en la misma transacción que el cambio.</p>
        </div>
        <div className="flex gap-2">
          <select className="campo sm:w-40" value={filtros.entidad} onChange={(e) => cambiar({ entidad: e.target.value })} aria-label="Entidad">
            <option value="">Todo</option><option value="producto">Productos</option><option value="pedido">Pedidos</option>
            <option value="categoria">Categorías</option><option value="usuario">Seguridad</option>
          </select>
          <select className="campo sm:w-52" value={filtros.accion} onChange={(e) => cambiar({ accion: e.target.value })} aria-label="Acción">
            <option value="">Todas las acciones</option>
            {Object.entries(ACCIONES).map(([k, a]) => <option key={k} value={k}>{a.texto}</option>)}
          </select>
        </div>
      </div>

      {registros.isLoading ? <FilasEsqueleto filas={8} />
        : registros.isError ? <ErrorCaja error={registros.error} reintentar={registros.refetch} />
        : registros.data.data.length === 0 ? <Vacio titulo="Sin registros" texto="Cuando alguien edite productos, stock o pedidos aparecerá aquí." />
        : (
          <div className="tarjeta overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-borde text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-4">Fecha</th><th className="p-4">Usuario</th><th className="p-4">Acción</th><th className="p-4">Sobre</th><th className="p-4">Detalle</th><th className="p-4">IP</th></tr>
              </thead>
              <tbody className="divide-y divide-borde/60 align-top">
                {registros.data.data.map((r) => {
                  const a = ACCIONES[r.accion] ?? { texto: r.accion, clase: 'bg-slate-500/20 text-slate-300' };
                  return (
                    <tr key={r.id} className="hover:bg-white/[.02]">
                      <td className="whitespace-nowrap p-4 text-slate-400">{fecha(r.created_at)}</td>
                      <td className="p-4">{r.usuario_email ?? <span className="text-slate-500">sistema</span>}</td>
                      <td className="p-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.clase}`}>{a.texto}</span></td>
                      <td className="p-4 text-slate-400">{r.entidad} {r.entidad === 'usuario' ? '' : idCorto(r.entidad_id)}</td>
                      <td className="p-4 text-slate-300"><Detalle registro={r} /></td>
                      <td className="p-4 font-mono text-xs text-slate-500">{r.ip ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      <Paginacion meta={registros.data?.meta} alCambiar={(page) => setFiltros({ ...filtros, page })} />
    </div>
  );
}
