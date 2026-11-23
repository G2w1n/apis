import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Banknote, CreditCard, Loader2, MapPin, ShieldCheck, Smartphone } from 'lucide-react';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTarifas } from '../../api/consultas.js';
import { mensajeError } from '../../api/cliente.js';
import ArteProducto from '../../components/ArteProducto.jsx';
import { Cargando, ErrorCaja, Vacio } from '../../components/ui.jsx';
import { soles } from '../../utils/formato.js';
import PasoEnvio from './PasoEnvio.jsx';
import PasoPago from './PasoPago.jsx';
import Exito from './Exito.jsx';

const PASOS = ['Envío', 'Pago', 'Revisión'];

// Dirección de la animación entre pasos: avanzar entra por la derecha, volver por la izquierda
const deslizar = {
  entra: (dir) => ({ opacity: 0, x: dir * 40 }),
  centro: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  sale: (dir) => ({ opacity: 0, x: dir * -40, transition: { duration: 0.18 } }),
};

export default function Checkout() {
  const carrito = useCarrito();
  const { api, usuario } = useAuth();
  const cliente = useQueryClient();
  const tarifas = useTarifas();
  const [paso, setPaso] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const [envio, setEnvio] = useState({ nombre: usuario?.nombre ?? '', telefono: '', direccion: '', distrito: '', referencia: '' });
  const [pago, setPago] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  const ir = (n) => { setDireccion(n > paso ? 1 : -1); setPaso(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const confirmar = useMutation({
    mutationFn: () => api('POST', '/pedidos', {
      body: {
        items: carrito.items.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
        envio: { ...envio, referencia: envio.referencia || '' },
        pago: pago.metodo === 'tarjeta' ? { metodo: 'tarjeta', tarjeta_ultimos4: pago.tarjeta_ultimos4 } : { metodo: pago.metodo },
      },
      // La misma clave en cada reintento: si se pulsa dos veces o falla la red, no se duplica el pedido
      headers: { 'Idempotency-Key': carrito.claveIdempotencia },
    }),
    onSuccess: ({ datos }) => { setConfirmado(datos); carrito.vaciar(); cliente.invalidateQueries(); window.scrollTo({ top: 0 }); },
  });

  if (confirmado) return <Exito pedido={confirmado} />;
  if (carrito.items.length === 0) {
    return <div className="pt-12"><Vacio titulo="Tu carrito está vacío" texto="Agrega productos para comprar." accion={<Link to="/catalogo" className="btn-primario">Ir al catálogo</Link>} /></div>;
  }
  if (tarifas.isLoading) return <Cargando texto="Cargando opciones de envío…" />;
  if (tarifas.isError) return <div className="pt-10"><ErrorCaja error={tarifas.error} reintentar={tarifas.refetch} /></div>;

  const t = tarifas.data;
  const subtotal = carrito.total;
  const tarifa = t.distritos.find((d) => d.distrito === envio.distrito);
  // Estimación para mostrar; el monto definitivo lo calcula la API
  const costoEnvio = !tarifa ? null : subtotal >= t.gratis_desde ? 0 : tarifa.costo;
  const total = subtotal + (costoEnvio ?? 0);
  const IconoPago = { tarjeta: CreditCard, yape: Smartphone, contraentrega: Banknote }[pago?.metodo];

  return (
    <div className="pt-8">
      <Link to="/catalogo" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Seguir comprando</Link>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Finalizar compra</h1>

      {/* Progreso */}
      <ol className="mb-8 mt-6 grid grid-cols-3 gap-3" aria-label="Pasos del checkout">
        {PASOS.map((nombre, i) => (
          <li key={nombre} aria-current={i === paso ? 'step' : undefined}>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <motion.div className="h-full bg-gradient-to-r from-acento to-violeta" initial={false}
                animate={{ width: i < paso ? '100%' : i === paso ? '50%' : '0%' }} transition={{ duration: 0.4 }} />
            </div>
            <p className={`mt-2 text-sm ${i <= paso ? 'font-semibold text-slate-100' : 'text-slate-500'}`}>{i + 1}. {nombre}</p>
          </li>
        ))}
      </ol>

      {/* min-w-0: sin esto, opciones largas del selector de distrito ensanchan la columna en celular */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="tarjeta min-w-0 overflow-hidden p-4 sm:p-6">
          <AnimatePresence mode="wait" custom={direccion} initial={false}>
            <motion.div key={paso} custom={direccion} variants={deslizar} initial="entra" animate="centro" exit="sale">
              {paso === 0 && (
                <PasoEnvio inicial={envio} tarifas={t} subtotal={subtotal} alContinuar={(d) => { setEnvio(d); ir(1); }} />
              )}
              {paso === 1 && (
                <PasoPago inicial={pago?.metodo ? { metodo: pago.metodo } : undefined} alVolver={() => ir(0)} alContinuar={(p) => { setPago(p); ir(2); }} />
              )}
              {paso === 2 && (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-borde p-4">
                      <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Envío</span>
                        <button type="button" className="normal-case text-acento hover:underline" onClick={() => ir(0)}>Cambiar</button>
                      </p>
                      <p className="font-semibold">{envio.nombre}</p>
                      <p className="text-sm text-slate-400">{envio.direccion}, {envio.distrito}</p>
                      <p className="text-sm text-slate-400">{envio.telefono}{envio.referencia ? ` · ${envio.referencia}` : ''}</p>
                    </div>
                    <div className="rounded-xl border border-borde p-4">
                      <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <span className="flex items-center gap-1.5">{IconoPago && <IconoPago className="h-3.5 w-3.5" />}Pago</span>
                        <button type="button" className="normal-case text-acento hover:underline" onClick={() => ir(1)}>Cambiar</button>
                      </p>
                      {pago.metodo === 'tarjeta' && <p className="font-semibold capitalize">{pago.marca ?? 'Tarjeta'} •••• {pago.tarjeta_ultimos4}</p>}
                      {pago.metodo === 'yape' && <p className="font-semibold">Yape · {pago.celular}</p>}
                      {pago.metodo === 'contraentrega' && <p className="font-semibold">Contraentrega</p>}
                    </div>
                  </div>
                  {confirmar.isError && (
                    <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {mensajeError(confirmar.error)}
                    </p>
                  )}
                  <div className="flex justify-between">
                    <button type="button" className="btn-secundario" onClick={() => ir(1)}><ArrowLeft className="h-4 w-4" />Pago</button>
                    <motion.button whileTap={{ scale: 0.97 }} className="btn-primario px-6 py-3 text-base" disabled={confirmar.isPending} onClick={() => confirmar.mutate()}>
                      {confirmar.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Procesando…</> : <>Confirmar y pagar {soles(total)}</>}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Resumen */}
        <aside className="tarjeta h-fit p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 font-semibold">Resumen ({carrito.cantidadTotal} producto{carrito.cantidadTotal === 1 ? '' : 's'})</h2>
          <ul className="space-y-3">
            {carrito.items.map(({ producto, cantidad }) => (
              <li key={producto.id} className="flex items-center gap-3">
                <ArteProducto producto={producto} tamano="sm" />
                <span className="min-w-0 flex-1 text-sm"><span className="block truncate">{producto.nombre}</span><span className="text-slate-500">{cantidad} × {soles(producto.precio)}</span></span>
                <span className="text-sm font-semibold tabular-nums">{soles(producto.precio * cantidad)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-borde pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-slate-400">Subtotal</dt><dd className="tabular-nums">{soles(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-400">Envío</dt>
              <dd className="tabular-nums">{costoEnvio === null ? <span className="text-slate-500">elige distrito</span> : costoEnvio === 0 ? <span className="text-emerald-300">Gratis</span> : soles(costoEnvio)}</dd>
            </div>
            <div className="flex justify-between border-t border-borde pt-3 text-base font-bold"><dt>Total</dt>
              <dd className="font-display tabular-nums"><AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={total} className="inline-block" initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>{soles(total)}</motion.span>
              </AnimatePresence></dd>
            </div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-xs text-slate-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />El stock se reserva al confirmar. Si alguien compra la última unidad antes, te avisamos sin cobrarte.</p>
        </aside>
      </div>
    </div>
  );
}
