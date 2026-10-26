import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCarrito } from '../context/CarritoContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { mensajeError } from '../api/cliente.js';
import { soles } from '../utils/formato.js';
import ArteProducto from './ArteProducto.jsx';

export default function CarritoDrawer() {
  const carrito = useCarrito();
  const { api, usuario } = useAuth();
  const cliente = useQueryClient();
  const navegar = useNavigate();
  const [error, setError] = useState(null);

  const comprar = useMutation({
    mutationFn: () => api('POST', '/pedidos', {
      body: { items: carrito.items.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })) },
      headers: { 'Idempotency-Key': carrito.claveIdempotencia },
    }),
    onSuccess: ({ datos, repetido }) => {
      toast.success(repetido ? 'Ese pedido ya estaba registrado' : '¡Pedido confirmado!', { description: `Total ${soles(datos.total)}` });
      carrito.vaciar();
      carrito.setAbierto(false);
      cliente.invalidateQueries();
      navegar('/mis-pedidos');
    },
    onError: (e) => setError(mensajeError(e)),
  });

  if (!carrito.abierto) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => carrito.setAbierto(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-aparecer flex-col border-l border-borde bg-panel">
        <header className="flex items-center justify-between border-b border-borde px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><ShoppingBag className="h-5 w-5 text-acento" />Tu carrito</h2>
          <button className="rounded-lg p-2 hover:bg-white/5" onClick={() => carrito.setAbierto(false)} aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </header>

        {carrito.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-400">
            <ShoppingBag className="h-12 w-12 text-slate-600" />
            <p>Tu carrito está vacío</p>
            <Link to="/catalogo" className="btn-primario" onClick={() => carrito.setAbierto(false)}>Ver catálogo</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto p-5">
              {carrito.items.map(({ producto, cantidad }) => (
                <li key={producto.id} className="flex gap-3 rounded-xl border border-borde bg-white/[.02] p-3">
                  <ArteProducto producto={producto} tamano="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{producto.nombre}</p>
                    <p className="text-sm text-slate-400">{soles(producto.precio)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="rounded-md border border-borde p-1 hover:border-acento" onClick={() => carrito.cambiarCantidad(producto.id, cantidad - 1)} aria-label="Quitar uno"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{cantidad}</span>
                      <button className="rounded-md border border-borde p-1 hover:border-acento" onClick={() => carrito.cambiarCantidad(producto.id, cantidad + 1)} aria-label="Agregar uno"><Plus className="h-3.5 w-3.5" /></button>
                      <button className="ml-auto rounded-md p-1 text-slate-500 hover:text-red-400" onClick={() => carrito.quitar(producto.id)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="space-y-3 border-t border-borde p-5">
              {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total</span>
                <span className="font-display text-2xl font-bold">{soles(carrito.total)}</span>
              </div>
              {usuario ? (
                <button className="btn-primario w-full py-3" disabled={comprar.isPending} onClick={() => { setError(null); comprar.mutate(); }}>
                  {comprar.isPending ? 'Procesando…' : 'Confirmar pedido'}
                </button>
              ) : (
                <Link to="/login" className="btn-primario w-full py-3" onClick={() => carrito.setAbierto(false)}>Inicia sesión para comprar</Link>
              )}
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />Protegido contra pedidos duplicados por doble clic
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
