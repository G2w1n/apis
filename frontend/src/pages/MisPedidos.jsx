import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Radio } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePedidos } from '../api/consultas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { mensajeError } from '../api/cliente.js';
import { ErrorCaja, EstadoChip, Vacio } from '../components/ui.jsx';
import { FilasEsqueleto } from '../components/Esqueletos.jsx';
import LineaEstado from '../components/LineaEstado.jsx';
import { ESTADOS, fecha, idCorto, soles } from '../utils/formato.js';

export default function MisPedidos() {
  const { api, esAdmin } = useAuth();
  // Seguimiento "en vivo": se consulta la API cada 5 s y se avisa cuando un pedido cambia de estado
  const pedidos = usePedidos({ limit: 50 }, true, 5000);
  const conocidos = useRef(null);
  useEffect(() => {
    const lista = pedidos.data?.data;
    if (!lista) return;
    const actual = new Map(lista.map((p) => [String(p.id), p.estado]));
    if (conocidos.current) {
      lista.forEach((p) => {
        const antes = conocidos.current.get(String(p.id));
        if (antes && antes !== p.estado) toast.info(`Tu pedido ${idCorto(p.id)} ahora está: ${ESTADOS[p.estado].texto}`, { duration: 6000 });
      });
    }
    conocidos.current = actual;
  }, [pedidos.data]);
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
      <p className="mb-8 mt-1 flex items-center gap-2 text-slate-400">
        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" /></span>
        <Radio className="h-4 w-4" aria-hidden />En vivo: se actualiza solo cuando cambia el estado.
      </p>

      {pedidos.isLoading ? <FilasEsqueleto />
        : pedidos.isError ? <ErrorCaja error={pedidos.error} reintentar={pedidos.refetch} />
        : lista.length === 0 ? <Vacio titulo="Aún no tienes pedidos" texto="Cuando compres algo aparecerá aquí." accion={<Link to="/catalogo" className="btn-primario">Ir al catálogo</Link>} />
        : (
          <div className="space-y-4">
            {lista.map((p) => (
              <motion.article key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="tarjeta p-5">
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
                {p.envio && (
                  <p className="mt-4 text-xs text-slate-500">
                    Envío a {p.envio.direccion}, {p.envio.distrito} · {p.costo_envio ? soles(p.costo_envio) : 'gratis'}
                    {p.pago && ` · ${p.pago.metodo === 'tarjeta' ? `tarjeta •••• ${p.pago.tarjeta_ultimos4}` : p.pago.metodo}`}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-borde pt-4">
                  <span className="text-sm text-slate-400">Total <span className="ml-2 font-display text-xl font-bold text-white">{soles(p.total)}</span></span>
                  <div className="flex gap-2">
                    <Link to={`/pedidos/${p.id}/comprobante`} className="btn-secundario"><FileText className="h-4 w-4" />Comprobante</Link>
                    {['pendiente', 'pagado'].includes(p.estado) && (
                      <button className="btn-peligro" disabled={cancelar.isPending} onClick={() => cancelar.mutate(p.id)}>Cancelar pedido</button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
    </div>
  );
}
