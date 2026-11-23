import { createContext, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { leer, guardar } from '../utils/almacen.js';
import { useBackend } from './ApiContext.jsx';

// Hasta 3 productos para comparar lado a lado (uno por API: los IDs cambian entre bases de datos)
export const MAX_COMPARAR = 3;
const CompararContext = createContext(null);

export function CompararProvider({ children }) {
  const { backend } = useBackend();
  const [listas, setListas] = useState(() => leer('voltec.comparar', {}));
  const lista = listas[backend.id] ?? [];

  const escribir = (nueva) => setListas((prev) => {
    const todo = { ...prev, [backend.id]: nueva };
    guardar('voltec.comparar', todo);
    return todo;
  });

  const valor = useMemo(() => ({
    lista,
    incluye: (id) => lista.some((p) => String(p.id) === String(id)),
    alternar(producto) {
      if (lista.some((p) => String(p.id) === String(producto.id))) return escribir(lista.filter((p) => String(p.id) !== String(producto.id)));
      if (lista.length >= MAX_COMPARAR) return toast.warning(`Puedes comparar hasta ${MAX_COMPARAR} productos`);
      escribir([...lista, { id: producto.id, nombre: producto.nombre, categoria: producto.categoria, imagen_url: producto.imagen_url, sku: producto.sku }]);
    },
    quitar: (id) => escribir(lista.filter((p) => String(p.id) !== String(id))),
    vaciar: () => escribir([]),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [lista, backend.id]);

  return <CompararContext.Provider value={valor}>{children}</CompararContext.Provider>;
}

export const useComparar = () => useContext(CompararContext);
