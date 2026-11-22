// Edición directa desde la tienda (solo admin), con actualización OPTIMISTA:
// el cambio se ve al instante y, si la API lo rechaza, se deshace y se muestra el motivo.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { useBackend } from '../context/ApiContext.jsx';
import { mensajeError } from './cliente.js';

// Aplica `cambio` al producto `id` en todas las consultas guardadas (catálogo, detalle, portada…)
function useCacheProductos() {
  const cliente = useQueryClient();
  const { backend } = useBackend();
  const esDeProductos = (q) => q.queryKey[0] === backend.id && ['productos', 'producto'].includes(q.queryKey[2]);

  return {
    async actualizar(id, cambio) {
      await cliente.cancelQueries({ predicate: esDeProductos });
      const antes = cliente.getQueriesData({ predicate: esDeProductos });
      const aplicar = (p) => (String(p.id) === String(id) ? { ...p, ...cambio(p) } : p);
      cliente.setQueriesData({ predicate: esDeProductos }, (datos) => {
        if (!datos) return datos;
        if (Array.isArray(datos.data)) return { ...datos, data: datos.data.map(aplicar) };
        return datos.id !== undefined ? aplicar(datos) : datos;
      });
      return antes;
    },
    restaurar: (antes) => antes?.forEach(([clave, datos]) => cliente.setQueryData(clave, datos)),
    refrescar: () => cliente.invalidateQueries({ predicate: (q) => q.queryKey[0] === backend.id }),
  };
}

const NOMBRES = { precio: 'precio', nombre: 'nombre', descripcion: 'descripción', stock_minimo: 'stock mínimo', imagen_url: 'imagen' };

const conBajoStock = (p, stock) => ({ stock, bajo_stock: stock <= p.stock_minimo });

/** PATCH /productos/:id con los campos indicados. Uso: editar.mutate({ id, cambios: { precio: 99.9 } }) */
export function useEditarProducto() {
  const { api } = useAuth();
  const cache = useCacheProductos();
  return useMutation({
    mutationFn: ({ id, cambios }) => api('PATCH', `/productos/${id}`, { body: cambios }),
    onMutate: ({ id, cambios }) => cache.actualizar(id, (p) => ({ ...cambios, ...('stock_minimo' in cambios && { bajo_stock: p.stock <= cambios.stock_minimo }) })),
    onError: (e, _v, antes) => { cache.restaurar(antes); toast.error(`No se guardó: ${mensajeError(e)}`); },
    onSuccess: (_r, { cambios }) => toast.success(`Guardado: ${Object.keys(cambios).map((c) => NOMBRES[c] ?? c).join(', ')}`),
    onSettled: cache.refrescar,
  });
}

/** POST /stock/movimientos. Uso: ajustar.mutate({ producto, cantidad: -1 }) (negativo = salida) */
export function useAjustarStock() {
  const { api } = useAuth();
  const cache = useCacheProductos();
  return useMutation({
    mutationFn: ({ producto, cantidad, motivo }) => api('POST', '/stock/movimientos', {
      body: {
        producto_id: producto.id,
        tipo: cantidad > 0 ? 'entrada' : 'salida',
        cantidad: Math.abs(cantidad),
        motivo: motivo || (cantidad > 0 ? 'Reposición rápida desde la tienda' : 'Ajuste rápido desde la tienda'),
      },
    }),
    onMutate: ({ producto, cantidad }) => cache.actualizar(producto.id, (p) => conBajoStock(p, Math.max(0, p.stock + cantidad))),
    onError: (e, _v, antes) => { cache.restaurar(antes); toast.error(mensajeError(e)); },
    onSuccess: ({ datos }) => toast.success(`Stock actualizado: ${datos.stock_resultante} unidades`),
    onSettled: cache.refrescar,
  });
}
