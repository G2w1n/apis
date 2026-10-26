import { Server } from 'lucide-react';
import { OPCIONES, useBackend } from '../context/ApiContext.jsx';
import { useSalud } from '../api/consultas.js';

// Permite cambiar en vivo entre Express, Django y Rails: la tienda funciona igual con las tres
export default function SelectorApi({ compacto = false }) {
  const { backend, cambiarBackend } = useBackend();
  const salud = useSalud();
  const estado = salud.isSuccess ? 'bg-emerald-400' : salud.isError ? 'bg-red-500' : 'bg-amber-400 animate-pulse';
  return (
    <label className="flex items-center gap-2 rounded-xl border border-borde bg-white/5 px-2.5 py-1.5 text-xs text-slate-300">
      <span className={`h-2 w-2 shrink-0 rounded-full ${estado}`} title={salud.isSuccess ? 'API en línea' : salud.isError ? 'Sin conexión' : 'Conectando…'} />
      {!compacto && <Server className="h-3.5 w-3.5 text-slate-500" aria-hidden />}
      <span className="sr-only">API</span>
      <select
        className="cursor-pointer bg-transparent font-medium text-slate-200 outline-none"
        value={backend.id}
        // La caché de React Query ya separa los datos por API (backend.id va en cada queryKey)
        onChange={(e) => cambiarBackend(e.target.value)}
      >
        {OPCIONES.map((o) => <option key={o.id} value={o.id} className="bg-panel">{o.nombre}</option>)}
      </select>
    </label>
  );
}
