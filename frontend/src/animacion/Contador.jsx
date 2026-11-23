import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

// Número que "cuenta" desde 0 hasta su valor la primera vez que se ve (KPIs del dashboard)
export default function Contador({ valor, formato = (n) => Math.round(n).toLocaleString('es-PE') }) {
  const ref = useRef(null);
  const visto = useInView(ref, { once: true });
  const reducir = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!visto || reducir) { el.textContent = formato(valor); return undefined; }
    const control = animate(0, valor, { duration: 1.1, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => { el.textContent = formato(v); } });
    return () => control.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, visto, reducir]);
  return <span ref={ref}>{formato(valor)}</span>;
}
