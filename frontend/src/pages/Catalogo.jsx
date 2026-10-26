import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useCategorias, useProductos } from '../api/consultas.js';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import { ErrorCaja, Paginacion, Vacio } from '../components/ui.jsx';
import { GrillaEsqueleto } from '../components/Esqueletos.jsx';

const ORDENES = [
  { valor: 'nombre', texto: 'Nombre A-Z' },
  { valor: 'precio', texto: 'Precio: menor a mayor' },
  { valor: '-precio', texto: 'Precio: mayor a menor' },
  { valor: '-creado', texto: 'Más recientes' },
];

export default function Catalogo() {
  // Los filtros viven en la URL: se pueden compartir y el botón "atrás" funciona
  const [params, setParams] = useSearchParams();
  const filtros = {
    q: params.get('q') ?? '',
    categoria: params.get('categoria') ?? '',
    precio_min: params.get('precio_min') ?? '',
    precio_max: params.get('precio_max') ?? '',
    bajo_stock: params.get('bajo_stock') ?? '',
    orden: params.get('orden') ?? 'nombre',
    page: params.get('page') ?? '1',
    limit: '12',
  };
  const [texto, setTexto] = useState(filtros.q);
  const productos = useProductos(filtros);
  const categorias = useCategorias();

  const cambiar = (cambios) => {
    const siguiente = new URLSearchParams(params);
    Object.entries({ page: '1', ...cambios }).forEach(([k, v]) => (v ? siguiente.set(k, v) : siguiente.delete(k)));
    setParams(siguiente);
  };

  // Búsqueda con espera de 350 ms para no consultar la API en cada tecla
  useEffect(() => {
    const t = setTimeout(() => { if (texto !== filtros.q) cambiar({ q: texto }); }, 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const lista = productos.data?.data ?? [];
  return (
    <div className="pt-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Catálogo</h1>
        <p className="mt-1 text-slate-400">{productos.data ? `${productos.data.meta.total} productos` : 'Buscando productos…'}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="tarjeta h-fit space-y-6 p-5 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4 text-acento" />Filtros</p>
          <div>
            <span className="etiqueta">Categoría</span>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {[{ id: '', nombre: 'Todas' }, ...(categorias.data?.data ?? [])].map((c) => (
                <button
                  key={c.id}
                  onClick={() => cambiar({ categoria: String(c.id) })}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition ${String(filtros.categoria) === String(c.id) ? 'bg-acento/15 font-semibold text-acento' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="etiqueta">Precio (S/)</span>
            <div className="flex gap-2">
              <input className="campo" type="number" min="0" placeholder="Mín" defaultValue={filtros.precio_min} onBlur={(e) => cambiar({ precio_min: e.target.value })} aria-label="Precio mínimo" />
              <input className="campo" type="number" min="0" placeholder="Máx" defaultValue={filtros.precio_max} onBlur={(e) => cambiar({ precio_max: e.target.value })} aria-label="Precio máximo" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-cyan-400" checked={filtros.bajo_stock === 'true'} onChange={(e) => cambiar({ bajo_stock: e.target.checked ? 'true' : '' })} />
            Solo últimas unidades
          </label>
          <button className="btn-secundario w-full" onClick={() => { setTexto(''); setParams(new URLSearchParams()); }}>Limpiar filtros</button>
        </aside>

        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input className="campo pl-10" placeholder="Buscar laptops, iPhone, audífonos…" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar" />
            </div>
            <select className="campo sm:w-56" value={filtros.orden} onChange={(e) => cambiar({ orden: e.target.value })} aria-label="Ordenar">
              {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
            </select>
          </div>

          {productos.isLoading ? <GrillaEsqueleto cantidad={6} className="sm:grid-cols-2 xl:grid-cols-3" />
            : productos.isError ? <ErrorCaja error={productos.error} reintentar={productos.refetch} />
            : lista.length === 0 ? <Vacio titulo="Sin resultados" texto="Prueba con otra búsqueda o limpia los filtros." />
            : (
              <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${productos.isFetching ? 'opacity-60' : ''}`}>
                {lista.map((p) => <TarjetaProducto key={p.id} producto={p} />)}
              </div>
            )}
          <Paginacion meta={productos.data?.meta} alCambiar={(page) => { cambiar({ page: String(page) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>
    </div>
  );
}
