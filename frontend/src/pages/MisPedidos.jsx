import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePedidos } from '../api/consultas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { mensajeError } from '../api/cliente.js';
import { ErrorCaja, EstadoChip, Vacio } from '../components/ui.jsx';
import { FilasEsqueleto } from '../components/Esqueletos.jsx';
import LineaEstado from '../components/LineaEstado.jsx';
import { fecha, idCorto, soles } from '../utils/formato.js';

export default function MisPedidos() {
  const { api, esAdmin } = useAuth();
  const pedidos = usePedidos({ limit: 50 });
  const cliente = useQueryClient();
  const cancelar = useMutation({
    mutationFn: (id) => api('POST', `/pedidos/${id}/cancelar`),
    onSuccess: () => { toast.success('Pedido cancelado: el stock fue devuelto'); cliente.invalidateQueries(); },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const lista = pedidos.data?.data ?? [];
  return (
    <div className="pt-8">
      <h1 className="font-display text-3xl font-bold">{esAdmin ? 'Todos los pedidos' : 'Mis pedidos'}</h1>
      <p className="mb-8 mt-1 text-slate-400">Sigue el estado de tus compras en tiempo real.</p>

      {pedidos.isLoading ? <FilasEsqueleto />
        : pedidos.isError ? <ErrorCaja error={pedidos.error} reintentar={pedidos.refetch} />
        : lista.length === 0 ? <Vacio titulo="Aún no tienes pedidos" texto="Cuando compres algo aparecerá aquí." accion={<Link to="/catalogo" className="btn-primario">Ir al catálogo</Link>} />
        : (
          <div className="space-y-4">
            {lista.map((p) => (
              <article key={p.id} className="tarjeta animate-aparecer p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-bold">Pedido {idCorto(p.id)}</span>
                    <EstadoChip estado={p.estado} />
                  </div>
                  <span className="text-sm text-slate-400">{fecha(p.created_at)}</span>
                </div>
                <ul className="my-4 divide-y divide-borde/60 text-sm">
                  {p.items.map((i) => (
                    <li key={i.producto_id} className="flex justify-between py-2">
                      <span><span className="text-slate-500">{i.cantidad}×</span> {i.nombre}</span>
                      <span className="tabular-nums text-slate-300">{soles(i.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <LineaEstado pedido={p} />
                <div className="mt-5 flex items-center justify-between border-t border-borde pt-4">
                  <span className="text-sm text-slate-400">Total <span className="ml-2 font-display text-xl font-bold text-white">{soles(p.total)}</span></span>
                  {['pendiente', 'pagado'].includes(p.estado) && (
                    <button className="btn-peligro" disabled={cancelar.isPending} onClick={() => cancelar.mutate(p.id)}>Cancelar pedido</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
    </div>
  );
}
