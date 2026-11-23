import { motion } from 'framer-motion';

// Aparece al entrar en pantalla; "indice" escalona elementos de una grilla
export default function Aparecer({ children, indice = 0, className, as = 'div' }) {
  const Etiqueta = motion[as];
  return (
    <Etiqueta
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, delay: Math.min(indice, 8) * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Etiqueta>
  );
}
