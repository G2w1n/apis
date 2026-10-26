// Hooks de datos con React Query: caché, reintentos y recarga automática al cambiar de API
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import { useBackend } from '../context/ApiContext.jsx';

function useConsulta(clave, ruta, opciones = {}) {
  const { api, usuario } = useAuth();
  const { backend } = useBackend();
  return useQuery({
    // La API elegida y el usuario son parte de la clave: si cambian, se vuelve a consultar
    queryKey: [backend.id, usuario?.id ?? 'anonimo', ...clave],
    queryFn: async () => (await api('GET', ruta)).datos,
    ...opciones,
  });
}

const qs = (params) => {
  const limpio = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));
  const texto = new URLSearchParams(limpio).toString();
  return texto ? `?${texto}` : '';
};

export const useProductos = (params = {}) => useConsulta(['productos', params], `/productos${qs(params)}`, { placeholderData: (prev) => prev });
export const useProducto = (id) => useConsulta(['producto', id], `/productos/${encodeURIComponent(id)}`, { enabled: Boolean(id) });
export const useCategorias = () => useConsulta(['categorias'], '/categorias', { staleTime: 5 * 60_000 });
export const usePedidos = (params = {}, habilitado = true) => useConsulta(['pedidos', params], `/pedidos${qs(params)}`, { enabled: habilitado });
export const useReporte = () => useConsulta(['reporte'], '/stock/reporte');
export const useAlertas = () => useConsulta(['alertas'], '/stock/alertas');
export const useMovimientos = (productoId) =>
  useConsulta(['movimientos', productoId], `/stock/movimientos${qs({ producto_id: productoId, limit: 50 })}`, { enabled: Boolean(productoId) });
export const useSalud = () => useConsulta(['salud'], '/health', { retry: 1, refetchInterval: 60_000 });
