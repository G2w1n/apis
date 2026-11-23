import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import ArteProducto from '../components/ArteProducto.jsx';

// Al agregar al carrito, una miniatura del producto "vuela" desde su imagen hasta el ícono del carrito
const VueloContext = createContext(null);
let idVuelo = 0;

export function VueloProvider({ children }) {
  const [vuelos, setVuelos] = useState([]);
  const [rebote, setRebote] = useState(0); // cambia cada vez que algo aterriza → el contador del carrito rebota
  const reducir = useReducedMotion();

  const lanzar = useCallback((producto, origen) => {
    const destino = document.getElementById('boton-carrito')?.getBoundingClientRect();
    const desde = origen?.getBoundingClientRect?.();
    if (reducir || !destino || !desde) { setRebote((n) => n + 1); return; }
    setVuelos((v) => [...v, { id: ++idVuelo, producto, desde, destino }]);
  }, [reducir]);

  const aterrizar = (id) => { setVuelos((v) => v.filter((x) => x.id !== id)); setRebote((n) => n + 1); };
  const valor = useMemo(() => ({ lanzar, rebote }), [lanzar, rebote]);

  return (
    <VueloContext.Provider value={valor}>
      {children}
      {createPortal(
        <AnimatePresence>
          {vuelos.map(({ id, producto, desde, destino }) => {
            const tam = 64;
            const x0 = desde.left + desde.width / 2 - tam / 2;
            const y0 = desde.top + desde.height / 2 - tam / 2;
            const x1 = destino.left + destino.width / 2 - tam / 2;
            const y1 = destino.top + destino.height / 2 - tam / 2;
            return (
              <motion.div key={id} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[60] overflow-hidden rounded-xl shadow-brillo"
                style={{ width: tam, height: tam }}
                initial={{ x: x0, y: y0, scale: 1.4, opacity: 0.95 }}
                // Trayectoria curva: sube un poco y luego cae sobre el carrito
                animate={{ x: [x0, (x0 + x1) / 2, x1], y: [y0, Math.min(y0, y1) - 120, y1], scale: [1.4, 0.9, 0.25], opacity: [0.95, 1, 0.6] }}
                transition={{ duration: 0.75, ease: [0.45, 0, 0.2, 1] }}
                onAnimationComplete={() => aterrizar(id)}>
                <ArteProducto producto={producto} tamano="sm" />
              </motion.div>
            );
          })}
        </AnimatePresence>,
        document.body,
      )}
    </VueloContext.Provider>
  );
}

export const useVuelo = () => useContext(VueloContext);
