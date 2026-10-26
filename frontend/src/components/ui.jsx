import { Loader2, PackageOpen } from 'lucide-react';
import { ESTADOS } from '../utils/formato.js';

export const Cargando = ({ texto = 'Cargando…' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> {texto}
  </div>
);

export const Vacio = ({ titulo, texto, accion }) => (
  <div className="tarjeta flex flex-col items-center gap-3 px-6 py-14 text-center">
    <PackageOpen className="h-10 w-10 text-slate-500" aria-hidden />
    <p className="font-display text-lg font-semibold">{titulo}</p>
    {texto && <p className="max-w-sm text-sm text-slate-400">{texto}</p>}
    {accion}
  </div>
);

export const ErrorCaja = ({ error, reintentar }) => (
  <div className="tarjeta border-red-500/30 px-6 py-10 text-center">
    <p className="font-semibold text-red-300">{error?.message ?? 'No se pudo cargar'}</p>
    {reintentar && <button className="btn-secundario mt-4" onClick={reintentar}>Reintentar</button>}
  </div>
);

export const EstadoChip = ({ estado }) => {
  const e = ESTADOS[estado] ?? { texto: estado, clase: 'bg-slate-500/20 text-slate-300 ring-slate-500/30' };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${e.clase}`}>{e.texto}</span>;
};

export function StockChip({ producto }) {
  if (producto.stock === 0) return <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-300 ring-1 ring-inset ring-red-500/30">Agotado</span>;
  if (producto.bajo_stock) return <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-400/30">¡Quedan {producto.stock}!</span>;
  return <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/25">En stock</span>;
}

export function Paginacion({ meta, alCambiar }) {
  if (!meta || meta.paginas <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Paginación">
      <button className="btn-secundario" disabled={meta.page <= 1} onClick={() => alCambiar(meta.page - 1)}>Anterior</button>
      <span className="px-3 text-sm text-slate-400">Página {meta.page} de {meta.paginas}</span>
      <button className="btn-secundario" disabled={meta.page >= meta.paginas} onClick={() => alCambiar(meta.page + 1)}>Siguiente</button>
    </nav>
  );
}

export function Modal({ titulo, abierto, alCerrar, children }) {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={alCerrar} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="tarjeta w-full max-w-lg animate-aparecer p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-xl font-bold">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
