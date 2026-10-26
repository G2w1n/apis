import { createContext, useContext, useMemo, useState } from 'react';
import { leer, guardar } from '../utils/almacen.js';
import { useBackend } from './ApiContext.jsx';

const CarritoContext = createContext(null);
const nuevaClave = () => crypto.randomUUID();

// Un carrito por API (los IDs de producto son distintos en cada base de datos)
export function CarritoProvider({ children }) {
  const { backend } = useBackend();
  const [carritos, setCarritos] = useState(() => leer('voltec.carritos', {}));
  const [abierto, setAbierto] = useState(false);
  const carrito = carritos[backend.id] ?? { items: [], clave: nuevaClave() };

  const escribir = (siguiente) => {
    setCarritos((prev) => {
      const todo = { ...prev, [backend.id]: siguiente };
      guardar('voltec.carritos', todo);
      return todo;
    });
  };

  const valor = useMemo(() => {
    const items = carrito.items;
    const totalCentimos = items.reduce((s, i) => s + Math.round(i.producto.precio * 100) * i.cantidad, 0);
    return {
      items,
      abierto,
      setAbierto,
      // Idempotency-Key: se mantiene hasta que el pedido se confirma, así un doble clic no duplica
      claveIdempotencia: carrito.clave,
      cantidadTotal: items.reduce((s, i) => s + i.cantidad, 0),
      total: totalCentimos / 100,
      agregar(producto, cantidad = 1) {
        const existe = items.find((i) => String(i.producto.id) === String(producto.id));
        const nuevos = existe
          ? items.map((i) => (i === existe ? { ...i, cantidad: Math.min(i.cantidad + cantidad, producto.stock) } : i))
          : [...items, { producto, cantidad: Math.min(cantidad, producto.stock) }];
        escribir({ ...carrito, items: nuevos });
        setAbierto(true);
      },
      cambiarCantidad(id, cantidad) {
        escribir({ ...carrito, items: items.map((i) => (String(i.producto.id) === String(id) ? { ...i, cantidad: Math.max(1, cantidad) } : i)) });
      },
      quitar(id) {
        escribir({ ...carrito, items: items.filter((i) => String(i.producto.id) !== String(id)) });
      },
      vaciar() {
        escribir({ items: [], clave: nuevaClave() });
      },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrito, abierto, backend.id]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export const useCarrito = () => useContext(CarritoContext);
