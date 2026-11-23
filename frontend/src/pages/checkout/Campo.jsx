import { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Campo de formulario accesible: etiqueta, error anunciado al lector de pantalla y animado al aparecer
const Campo = forwardRef(function Campo({ id, etiqueta, error, ayuda, como = 'input', children, className = '', ...props }, ref) {
  const Elemento = como;
  const idError = `${id}-error`;
  return (
    <div className={className}>
      <label className="etiqueta" htmlFor={id}>{etiqueta}</label>
      <Elemento id={id} ref={ref} aria-invalid={Boolean(error)} aria-describedby={error ? idError : undefined}
        className={`campo ${error ? 'border-red-500/60 focus:border-red-400 focus:ring-red-500/20' : ''}`} {...props}>
        {children}
      </Elemento>
      <AnimatePresence initial={false}>
        {error
          ? <motion.p key="e" id={idError} role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-red-300">{error.message}</motion.p>
          : ayuda && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
      </AnimatePresence>
    </div>
  );
});

export default Campo;
