import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Zap } from 'lucide-react';
import { usePedido } from '../api/consultas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Cargando, ErrorCaja } from '../components/ui.jsx';
import { fecha, idCorto, soles } from '../utils/formato.js';

const PAGOS = { tarjeta: 'Tarjeta', yape: 'Yape', contraentrega: 'Contraentrega' };

/*
 * Comprobante imprimible. "Guardar como PDF" usa el diálogo de impresión del navegador:
 * no hace falta ninguna librería y el PDF sale con texto seleccionable.
 * Colores fijos (no del tema) para que siempre se imprima en blanco y negro legible.
 */
export default function Comprobante() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { data: p, isLoading, isError, error, refetch } = usePedido(id);

  if (isLoading) return <Cargando />;
  if (isError) return <div className="mx-auto max-w-2xl p-6"><ErrorCaja error={error} reintentar={refetch} /></div>;

  return (
    <div className="min-h-screen bg-[#e2e8f0] px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-2xl justify-between print:hidden">
        <Link to="/mis-pedidos" className="inline-flex items-center gap-2 rounded-xl border border-[#cbd5e1] bg-[#ffffff] px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc]"><ArrowLeft className="h-4 w-4" />Mis pedidos</Link>
        <button className="btn-primario" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir / Guardar PDF</button>
      </div>
      <article className="mx-auto max-w-2xl rounded-2xl bg-[#ffffff] p-8 text-[#0f172a] shadow-xl print:max-w-none print:rounded-none print:shadow-none">
        <header className="flex items-start justify-between border-b border-[#e2e8f0] pb-6">
          <div>
            <p className="flex items-center gap-2 font-display text-2xl font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0f172a] text-[#22d3ee]"><Zap className="h-5 w-5" fill="currentColor" /></span>VOLTEC
            </p>
            <p className="mt-1 text-xs text-[#64748b]">Proyecto académico · comprobante sin valor tributario</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-[#64748b]">Comprobante de compra</p>
            <p className="font-display text-xl font-bold">{idCorto(p.id)}</p>
            <p className="text-sm text-[#475569]">{fecha(p.created_at)}</p>
          </div>
        </header>

        <section className="grid gap-6 py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Cliente</p>
            <p className="font-semibold">{p.envio?.nombre ?? usuario?.nombre}</p>
            {p.envio && <><p>{p.envio.direccion}</p><p>{p.envio.distrito} ({p.envio.zona})</p><p>Tel. {p.envio.telefono}</p></>}
          </div>
          <div className="sm:text-right">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#64748b]">Pago</p>
            <p className="font-semibold">{p.pago ? PAGOS[p.pago.metodo] : '—'}{p.pago?.tarjeta_ultimos4 ? ` •••• ${p.pago.tarjeta_ultimos4}` : ''}</p>
            <p>Estado: <b className="capitalize">{p.estado}</b></p>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead className="border-y border-[#e2e8f0] text-left text-xs uppercase text-[#64748b]">
            <tr><th className="py-2">Producto</th><th className="py-2 text-right">Cant.</th><th className="py-2 text-right">P. unit.</th><th className="py-2 text-right">Importe</th></tr>
          </thead>
          <tbody>
            {p.items.map((i) => (
              <tr key={i.producto_id} className="border-b border-[#f1f5f9]">
                <td className="py-2.5"><span className="font-medium">{i.nombre}</span><span className="block text-xs text-[#64748b]">{i.sku}</span></td>
                <td className="py-2.5 text-right tabular-nums">{i.cantidad}</td>
                <td className="py-2.5 text-right tabular-nums">{soles(i.precio_unitario)}</td>
                <td className="py-2.5 text-right tabular-nums">{soles(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 w-64 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-[#475569]">Subtotal</dt><dd className="tabular-nums">{soles(p.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-[#475569]">Envío</dt><dd className="tabular-nums">{p.costo_envio ? soles(p.costo_envio) : 'Gratis'}</dd></div>
          <div className="flex justify-between border-t border-[#0f172a] pt-2 text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{soles(p.total)}</dd></div>
        </dl>
        <p className="mt-10 text-center text-xs text-[#94a3b8]">Gracias por comprar en Voltec · Generado desde la API ({p.id})</p>
      </article>
    </div>
  );
}
