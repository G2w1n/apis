import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { FileText, PackageCheck, ShoppingBag } from 'lucide-react';
import { fecha, idCorto, soles } from '../../utils/formato.js';

// Pantalla final: check dibujándose, confeti y accesos al comprobante y al seguimiento
export default function Exito({ pedido }) {
  const reducir = useReducedMotion();
  useEffect(() => {
    if (reducir) return undefined;
    // Canvas propio y sin Web Worker: la Content-Security-Policy de Voltec no permite workers desde blobs
    const lienzo = Object.assign(document.createElement('canvas'), { className: 'pointer-events-none fixed inset-0 z-[90] h-full w-full' });
    lienzo.setAttribute('aria-hidden', 'true');
    document.body.appendChild(lienzo);
    const lanzar = confetti.create(lienzo, { resize: true, useWorker: false });
    const colores = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24'];
    lanzar({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: colores });
    const t = setTimeout(() => {
      lanzar({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors: colores });
      lanzar({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors: colores });
    }, 350);
    const limpiar = setTimeout(() => lienzo.remove(), 6000);
    return () => { clearTimeout(t); clearTimeout(limpiar); lanzar.reset(); lienzo.remove(); };
  }, [reducir]);

  const llegada = new Date(Date.now() + (pedido.envio?.dias ?? 2) * 86_400_000);
  return (
    <div className="mx-auto max-w-xl pt-10 text-center">
      <svg viewBox="0 0 52 52" className="mx-auto h-24 w-24" aria-hidden>
        <motion.circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-400"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
        <motion.path d="M15 27 l7 7 l15 -16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.35 }} />
      </svg>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <h1 className="mt-6 font-display text-3xl font-bold">¡Gracias por tu compra!</h1>
        <p className="mt-2 text-slate-400">Pedido <b className="text-slate-200">{idCorto(pedido.id)}</b> · {soles(pedido.total)}</p>
        {pedido.envio && (
          <p className="mt-1 text-sm text-slate-500">
            Llega a {pedido.envio.distrito} aprox. el {llegada.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-500">Registrado el {fecha(pedido.created_at)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/pedidos/${pedido.id}/comprobante`} className="btn-primario"><FileText className="h-4 w-4" />Ver comprobante</Link>
          <Link to="/mis-pedidos" className="btn-secundario"><PackageCheck className="h-4 w-4" />Seguir mi pedido</Link>
          <Link to="/catalogo" className="btn-secundario"><ShoppingBag className="h-4 w-4" />Seguir comprando</Link>
        </div>
      </motion.div>
    </div>
  );
}
