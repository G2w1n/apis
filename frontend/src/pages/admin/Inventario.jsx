import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAlertas, useMovimientos, useProductos } from '../../api/consultas.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { mensajeError } from '../../api/cliente.js';
import { Cargando, Vacio } from '../../components/ui.jsx';
import { fecha } from '../../utils/formato.js';

export default function Inventario() {
  const { api } = useAuth();
  const cliente = useQueryClient();
  const productos = useProductos({ limit: 100, orden: 'nombre' });
  const alertas = useAlertas();
  const lista = productos.data?.data ?? [];
  const [productoId, setProductoId] = useState('');
  const seleccionado = productoId || lista[0]?.id || '';
  const kardex = useMovimientos(seleccionado);
  const [mov, setMov] = useState({ tipo: 'entrada', cantidad: '10', motivo: 'Compra a proveedor' });

  const registrar = useMutation({
    mutationFn: () => api('POST', '/stock/movimientos', { body: { producto_id: seleccionado, tipo: mov.tipo, cantidad: Number(mov.cantidad), motivo: mov.motivo } }),
    onSuccess: ({ datos }) => { toast.success(`Movimiento registrado · nuevo saldo ${datos.stock_resultante}`); cliente.invalidateQueries(); },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (productos.isLoading) return <Cargando />;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="tarjeta p-5 lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Kardex</h2>
            <p className="text-xs text-slate-500">Cada cambio de stock queda registrado con el saldo resultante</p>
          </div>
          <select className="campo sm:w-72" value={seleccionado} onChange={(e) => setProductoId(e.target.value)} aria-label="Producto">
            {lista.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock {p.stock})</option>)}
          </select>
        </div>
        {kardex.isLoading ? <Cargando /> : (kardex.data?.data ?? []).length === 0 ? <Vacio titulo="Sin movimientos" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="py-2">Fecha</th><th className="py-2">Tipo</th><th className="py-2 text-right">Cantidad</th><th className="py-2 text-right">Saldo</th><th className="py-2 pl-4">Motivo</th></tr>
              </thead>
              <tbody className="divide-y divide-borde/60">
                {kardex.data.data.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 text-slate-400">{fecha(m.created_at)}</td>
                    <td className="py-2.5">
                      {m.tipo === 'entrada'
                        ? <span className="inline-flex items-center gap-1 text-emerald-300"><ArrowUpRight className="h-4 w-4" />Entrada</span>
                        : <span className="inline-flex items-center gap-1 text-red-300"><ArrowDownRight className="h-4 w-4" />Salida</span>}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{m.tipo === 'entrada' ? '+' : '−'}{m.cantidad}</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{m.stock_resultante}</td>
                    <td className="py-2.5 pl-4 text-slate-400">{m.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="space-y-6">
        <section className="tarjeta p-5">
          <h2 className="mb-4 font-semibold">Registrar movimiento</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); registrar.mutate(); }}>
            <div className="grid grid-cols-2 gap-2">
              {['entrada', 'salida'].map((t) => (
                <button type="button" key={t} onClick={() => setMov({ ...mov, tipo: t, motivo: t === 'entrada' ? 'Compra a proveedor' : 'Producto dañado' })}
                  className={`rounded-xl py-2 text-sm font-semibold capitalize transition ${mov.tipo === t ? (t === 'entrada' ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40' : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40') : 'border border-borde text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div><label className="etiqueta" htmlFor="cantidad">Cantidad</label><input id="cantidad" type="number" min="1" className="campo" value={mov.cantidad} onChange={(e) => setMov({ ...mov, cantidad: e.target.value })} required /></div>
            <div><label className="etiqueta" htmlFor="motivo">Motivo</label><input id="motivo" className="campo" value={mov.motivo} onChange={(e) => setMov({ ...mov, motivo: e.target.value })} required /></div>
            <button className="btn-primario w-full" disabled={registrar.isPending || !seleccionado}>Registrar</button>
          </form>
        </section>

        <section className="tarjeta p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-amber-300" />Alertas de stock bajo</h2>
          {(alertas.data?.data ?? []).length === 0 ? <p className="text-sm text-slate-400">Todo el inventario está sobre su mínimo.</p> : (
            <ul className="space-y-2">
              {alertas.data.data.map((p) => (
                <li key={p.id}>
                  <button className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/5" onClick={() => setProductoId(p.id)}>
                    <span className="truncate">{p.nombre}</span>
                    <span className={`shrink-0 text-xs font-semibold ${p.stock === 0 ? 'text-red-300' : 'text-amber-300'}`}>{p.stock} / mín {p.stock_minimo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
