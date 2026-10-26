import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCategorias, useProductos } from '../../api/consultas.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { mensajeError } from '../../api/cliente.js';
import ArteProducto from '../../components/ArteProducto.jsx';
import { Cargando, ErrorCaja, Modal, Paginacion, StockChip } from '../../components/ui.jsx';
import { soles } from '../../utils/formato.js';

const VACIO = { sku: '', nombre: '', descripcion: '', precio: '', stock: '10', stock_minimo: '3', categoria_id: '' };

export default function AdminProductos() {
  const { api } = useAuth();
  const cliente = useQueryClient();
  const [buscar, setBuscar] = useState('');
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState(null); // null = cerrado, {} = nuevo, producto = editar
  const productos = useProductos({ q: buscar, page: pagina, limit: 10, orden: '-creado' });

  const eliminar = useMutation({
    mutationFn: (id) => api('DELETE', `/productos/${id}`),
    onSuccess: () => { toast.success('Producto retirado del catálogo'); cliente.invalidateQueries(); },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="campo pl-10" placeholder="Buscar por nombre o SKU" value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} aria-label="Buscar productos" />
        </div>
        <button className="btn-primario" onClick={() => setEditando({})}><Plus className="h-4 w-4" />Nuevo producto</button>
      </div>

      {productos.isLoading ? <Cargando /> : productos.isError ? <ErrorCaja error={productos.error} reintentar={productos.refetch} /> : (
        <div className="tarjeta overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-borde text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="p-4">Producto</th><th className="p-4">Categoría</th><th className="p-4 text-right">Precio</th><th className="p-4 text-right">Stock</th><th className="p-4" /></tr>
            </thead>
            <tbody className="divide-y divide-borde/60">
              {productos.data.data.map((p) => (
                <tr key={p.id} className="hover:bg-white/[.02]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <ArteProducto producto={p} tamano="sm" />
                      <div><p className="font-semibold">{p.nombre}</p><p className="text-xs text-slate-500">{p.sku}</p></div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{p.categoria?.nombre ?? '—'}</td>
                  <td className="p-4 text-right tabular-nums">{soles(p.precio)}</td>
                  <td className="p-4 text-right"><div className="flex items-center justify-end gap-2"><span className="tabular-nums">{p.stock}</span><StockChip producto={p} /></div></td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={() => setEditando(p)} aria-label={`Editar ${p.nombre}`}><Pencil className="h-4 w-4" /></button>
                      <button className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300" aria-label={`Eliminar ${p.nombre}`}
                        onClick={() => window.confirm(`¿Retirar "${p.nombre}" del catálogo?`) && eliminar.mutate(p.id)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Paginacion meta={productos.data?.meta} alCambiar={setPagina} />
      <FormularioProducto producto={editando} alCerrar={() => setEditando(null)} />
    </div>
  );
}

function FormularioProducto({ producto, alCerrar }) {
  const { api } = useAuth();
  const cliente = useQueryClient();
  const categorias = useCategorias();
  const esNuevo = producto && !producto.id;
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState(null);
  const [cargado, setCargado] = useState(null);

  // Al abrir el modal, rellenar el formulario con el producto (o vacío si es nuevo)
  if (producto !== cargado) {
    setCargado(producto);
    setError(null);
    setForm(producto?.id
      ? { ...VACIO, ...producto, precio: String(producto.precio), stock_minimo: String(producto.stock_minimo), categoria_id: producto.categoria?.id ?? '' }
      : VACIO);
  }

  const guardar = useMutation({
    mutationFn: () => {
      const body = {
        sku: form.sku, nombre: form.nombre, descripcion: form.descripcion,
        precio: Number(form.precio), stock_minimo: Number(form.stock_minimo),
        categoria_id: form.categoria_id || null,
        ...(esNuevo && { stock: Number(form.stock) }), // el stock de un producto existente solo cambia con movimientos
      };
      return esNuevo ? api('POST', '/productos', { body }) : api('PATCH', `/productos/${producto.id}`, { body });
    },
    onSuccess: () => { toast.success(esNuevo ? 'Producto creado' : 'Cambios guardados'); cliente.invalidateQueries(); alCerrar(); },
    onError: (e) => setError(mensajeError(e)),
  });

  const campo = (nombre) => ({ value: form[nombre], onChange: (e) => setForm({ ...form, [nombre]: e.target.value }) });
  return (
    <Modal titulo={esNuevo ? 'Nuevo producto' : 'Editar producto'} abierto={Boolean(producto)} alCerrar={alCerrar}>
      <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); guardar.mutate(); }}>
        <div><label className="etiqueta" htmlFor="sku">SKU</label><input id="sku" className="campo uppercase" required {...campo('sku')} /></div>
        <div><label className="etiqueta" htmlFor="precio">Precio (S/)</label><input id="precio" type="number" step="0.01" min="0.01" className="campo" required {...campo('precio')} /></div>
        <div className="col-span-2"><label className="etiqueta" htmlFor="nombre">Nombre</label><input id="nombre" className="campo" required {...campo('nombre')} /></div>
        <div className="col-span-2"><label className="etiqueta" htmlFor="descripcion">Descripción</label><textarea id="descripcion" rows={2} className="campo" {...campo('descripcion')} /></div>
        {esNuevo
          ? <div><label className="etiqueta" htmlFor="stock">Stock inicial</label><input id="stock" type="number" min="0" className="campo" {...campo('stock')} /></div>
          : <div><span className="etiqueta">Stock</span><p className="py-2.5 text-sm text-slate-400">{producto?.stock} · se cambia en Inventario</p></div>}
        <div><label className="etiqueta" htmlFor="minimo">Stock mínimo</label><input id="minimo" type="number" min="0" className="campo" {...campo('stock_minimo')} /></div>
        <div className="col-span-2">
          <label className="etiqueta" htmlFor="categoria">Categoría</label>
          <select id="categoria" className="campo" {...campo('categoria_id')}>
            <option value="">Sin categoría</option>
            {(categorias.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        {error && <p className="col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="col-span-2 flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secundario" onClick={alCerrar}>Cancelar</button>
          <button className="btn-primario" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
