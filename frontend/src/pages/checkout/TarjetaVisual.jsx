import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const COLORES = {
  visa: 'from-sky-600 via-indigo-600 to-violet-700',
  mastercard: 'from-orange-500 via-rose-600 to-fuchsia-700',
  amex: 'from-teal-500 via-cyan-600 to-sky-700',
};

// Vista previa de la tarjeta: se llena mientras escribes y gira al escribir el CVV
export default function TarjetaVisual({ numero, titular, vencimiento, cvv, marca, girada }) {
  const digitos = (numero || '').replace(/\s/g, '');
  const mostrado = (digitos + '•'.repeat(Math.max(0, 16 - digitos.length))).replace(/(.{4})/g, '$1 ').trim();
  const cara = `absolute inset-0 rounded-2xl bg-gradient-to-br ${COLORES[marca] ?? 'from-slate-600 via-slate-700 to-slate-900'} p-5 text-white shadow-2xl [backface-visibility:hidden]`;
  return (
    <div className="mx-auto aspect-[1.586] w-full max-w-sm [perspective:1200px]" aria-hidden>
      <motion.div className="relative h-full w-full [transform-style:preserve-3d]" animate={{ rotateY: girada ? 180 : 0 }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}>
        <div className={`${cara} flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-display font-bold"><Zap className="h-5 w-5" fill="currentColor" />Voltec Pay</span>
            <span className="font-display text-lg font-bold uppercase italic">{marca ?? ''}</span>
          </div>
          <div className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" />
          <p className="font-mono text-xl tracking-widest">{mostrado}</p>
          <div className="flex justify-between text-xs uppercase">
            <span><span className="block text-[10px] opacity-70">Titular</span>{titular || 'NOMBRE APELLIDO'}</span>
            <span className="text-right"><span className="block text-[10px] opacity-70">Vence</span>{vencimiento || 'MM/AA'}</span>
          </div>
        </div>
        <div className={`${cara} [transform:rotateY(180deg)]`} style={{ padding: 0 }}>
          <div className="mt-6 h-10 bg-black/70" />
          <div className="mx-5 mt-5 flex items-center justify-end rounded bg-white/90 px-3 py-1.5 font-mono text-slate-900">{cvv || '•••'}</div>
          <p className="mx-5 mt-4 text-[10px] opacity-70">Pago simulado: el número completo nunca se envía a la API.</p>
        </div>
      </motion.div>
    </div>
  );
}
