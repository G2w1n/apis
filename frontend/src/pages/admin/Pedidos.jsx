import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePedidos } from '../../api/consultas.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { mensajeError } from '../../api/cliente.js';
import { ErrorCaja, EstadoChip, Paginacion, Vacio } from '../../components/ui.jsx';
import { FilasEsqueleto } from '../../components/Esqueletos.jsx';
import { ESTADOS, fecha, idCorto, soles } from '../../utils/formato.js';

// Siguiente paso permitido por la máquina de estados de la API
const SIGUIENTE = { pendiente: ['pagado', 'Marcar pagado'], pagado: ['enviado', 'Enviar'], enviado: ['entregado', 'Entregado'] };

export default function AdminPedidos() {
  const { api } = useAuth();
  const cliente = useQueryClient();
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const pedidos = usePedidos({ estado, page: pagina, limit: 15 });

  const cambiar = useMutation({
    mutationFn: ({ id, nuevo }) => (nuevo === 'cancelado'
      ? api('POST', `/pedidos/${id}/cancelar`)
      : api('PATCH', `/pedidos/${id}/estado`, { body: { estado: nuevo } })),
    onSuccess: (_r, { nuevo }) => { toast.success(`Pedido → ${ESTADOS[nuevo].texto}`); cliente.invalidateQueries(); },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {['', ...Object.keys(ESTADOS)].map((e) => (
          <button key={e || 'todos'} onClick={() => { setEstado(e); setPagina(1); }}
            className={`rounded-full px-4 py-1.5 text-sm transition ${estado === e ? 'bg-acento font-semibold text-slate-950' : 'border border-borde text-slate-300 hover:border-acento/60'}`}>
            {e ? ESTADOS[e].texto : 'Todos'}
          </button>
        ))}
      </div>

      {pedidos.isLoading ? <FilasEsqueleto /> : pedidos.isError ? <ErrorCaja error={pedidos.error} reintentar={pedidos.refetch} />
        : pedidos.data.data.length === 0 ? <Vacio titulo="No hay pedidos con este estado" /> : (
          <div className="tarjeta overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-borde text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-4">Pedido</th><th className="p-4">Fecha</th><th className="p-4">Productos</th><th className="p-4 text-right">Total</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr>
              </thead>
              <tbody className="divide-y divide-borde/60">
                {pedidos.data.data.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[.02]">
                    <td className="p-4 font-semibold">{idCorto(p.id)}</td>
                    <td className="p-4 text-slate-400">{fecha(p.created_at)}</td>
                    <td className="p-4 text-slate-300">{p.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')}</td>
                    <td className="p-4 text-right tabular-nums">{soles(p.total)}</td>
                    <td className="p-4"><EstadoChip estado={p.estado} /></td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {SIGUIENTE[p.estado] && (
                          <button className="btn-secundario px-3 py-1.5" disabled={cambiar.isPending} onClick={() => cambiar.mutate({ id: p.id, nuevo: SIGUIENTE[p.estado][0] })}>
                            {SIGUIENTE[p.estado][1]}
                          </button>
                        )}
                        {['pendiente', 'pagado'].includes(p.estado) && (
                          <button className="btn-peligro px-3 py-1.5" disabled={cambiar.isPending} onClick={() => cambiar.mutate({ id: p.id, nuevo: 'cancelado' })}>Cancelar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      <Paginacion meta={pedidos.data?.meta} alCambiar={setPagina} />
    </div>
  );
}
