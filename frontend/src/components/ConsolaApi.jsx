import { useState } from 'react';
import { ChevronRight, Terminal, Trash2, X } from 'lucide-react';
import { useConsola } from '../context/ConsolaContext.jsx';

const COLOR_METODO = {
  GET: 'text-sky-300', POST: 'text-emerald-300', PATCH: 'text-amber-300', PUT: 'text-amber-300', DELETE: 'text-red-300',
};
const colorEstado = (s) => (s === 0 || s >= 500 ? 'bg-red-500/20 text-red-300' : s >= 400 ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/15 text-emerald-300');

function Json({ valor }) {
  if (valor === undefined || valor === null) return <p className="text-slate-500">(vacío)</p>;
  return <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/30 p-2.5 text-[11px] leading-relaxed text-slate-300">{JSON.stringify(valor, null, 2)}</pre>;
}

function Fila({ r }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <li className="border-b border-borde/60">
      <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-mono text-xs hover:bg-white/[.03]" onClick={() => setAbierta(!abierta)} aria-expanded={abierta}>
        <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${abierta ? 'rotate-90' : ''}`} aria-hidden />
        <span className={`w-12 shrink-0 font-bold ${COLOR_METODO[r.metodo] ?? 'text-slate-300'}`}>{r.metodo}</span>
        <span className="min-w-0 flex-1 truncate text-slate-200">{r.ruta}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${colorEstado(r.status)}`}>{r.status || 'ERR'}</span>
        <span className="w-14 shrink-0 text-right tabular-nums text-slate-500">{r.ms} ms</span>
      </button>
      {abierta && (
        <div className="space-y-3 px-4 pb-4 text-xs">
          <p className="break-all font-mono text-[11px] text-slate-500">{r.base}{r.ruta}{r.autenticado ? ' · con token JWT' : ''}</p>
          {r.envio !== undefined && <div><p className="mb-1 font-semibold text-slate-400">Enviado</p><Json valor={r.envio} /></div>}
          <div><p className="mb-1 font-semibold text-slate-400">Respuesta</p><Json valor={r.respuesta} /></div>
        </div>
      )}
    </li>
  );
}

// Panel inferior que muestra en vivo cada petición HTTP que la página le hace a la API
export default function ConsolaApi() {
  const { registros, abierta, alternar, limpiar, noLeidos } = useConsola();
  return (
    <>
      <button
        onClick={alternar}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl border border-borde bg-panel/95 px-3.5 py-2.5 text-sm font-semibold shadow-xl backdrop-blur hover:border-acento/60"
        aria-expanded={abierta} aria-controls="consola-api"
      >
        <Terminal className="h-4 w-4 text-acento" aria-hidden />Consola API
        {noLeidos > 0 && <span className="rounded-full bg-acento px-1.5 text-[11px] font-bold text-slate-950">{noLeidos > 99 ? '99+' : noLeidos}</span>}
      </button>

      {abierta && (
        <section id="consola-api" aria-label="Consola de la API"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[45vh] animate-aparecer flex-col border-t border-borde bg-panel/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:left-4 sm:h-[60vh] sm:w-[34rem] sm:rounded-2xl sm:border">
          <header className="flex items-center justify-between border-b border-borde px-4 py-3">
            <div>
              <p className="flex items-center gap-2 font-semibold"><Terminal className="h-4 w-4 text-acento" aria-hidden />Consola de la API</p>
              <p className="text-xs text-slate-500">Cada petición que hace esta página, en vivo</p>
            </div>
            <div className="flex gap-1">
              <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={limpiar} aria-label="Limpiar consola" title="Limpiar"><Trash2 className="h-4 w-4" /></button>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={alternar} aria-label="Cerrar consola"><X className="h-4 w-4" /></button>
            </div>
          </header>
          {registros.length === 0
            ? <p className="p-6 text-center text-sm text-slate-500">Aún no hay peticiones. Navega o edita un producto.</p>
            : <ul className="flex-1 overflow-y-auto">{registros.map((r) => <Fila key={r.id} r={r} />)}</ul>}
        </section>
      )}
    </>
  );
}
