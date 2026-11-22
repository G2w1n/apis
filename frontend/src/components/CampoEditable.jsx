import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';

/*
 * Muestra un valor; al hacer clic se convierte en un campo. Enter guarda, Esc cancela.
 * tipo: 'texto' | 'multilinea' | 'precio' | 'entero'
 */
export default function CampoEditable({ valor, tipo = 'texto', alGuardar, formato = (v) => v, etiqueta, className = '', guardando = false }) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState('');
  const [error, setError] = useState(null);
  const campo = useRef(null);

  useEffect(() => { if (editando) campo.current?.select(); }, [editando]);

  const abrir = () => { setBorrador(valor ?? ''); setError(null); setEditando(true); };
  const cancelar = () => { setEditando(false); setError(null); };

  const guardar = () => {
    let nuevo = typeof borrador === 'string' ? borrador.trim() : borrador;
    if (tipo === 'precio' || tipo === 'entero') {
      nuevo = Number(nuevo);
      if (!Number.isFinite(nuevo) || nuevo < 0 || (tipo === 'precio' && nuevo === 0)) return setError('Número inválido');
      if (tipo === 'entero' && !Number.isInteger(nuevo)) return setError('Debe ser entero');
      if (tipo === 'precio' && Math.round(nuevo * 100) !== nuevo * 100) return setError('Máximo 2 decimales');
    } else if (!nuevo && tipo === 'texto') {
      return setError('No puede quedar vacío');
    }
    setEditando(false);
    if (nuevo !== valor) alGuardar(nuevo);
  };

  if (!editando) {
    return (
      <button type="button" onClick={abrir} title={`Editar ${etiqueta}`} aria-label={`Editar ${etiqueta}`}
        className={`group/edit -mx-1.5 inline-flex max-w-full items-center gap-1.5 rounded-lg px-1.5 text-left ring-1 ring-transparent transition hover:bg-acento/5 hover:ring-acento/40 ${className}`}>
        <span className="min-w-0">{formato(valor)}</span>
        {guardando
          ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-acento" aria-hidden />
          : <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-500 opacity-60 group-hover/edit:text-acento group-hover/edit:opacity-100" aria-hidden />}
      </button>
    );
  }

  const comun = {
    ref: campo, value: borrador, 'aria-label': etiqueta,
    onChange: (e) => { setBorrador(e.target.value); setError(null); },
    onKeyDown: (e) => {
      if (e.key === 'Escape') cancelar();
      if (e.key === 'Enter' && (tipo !== 'multilinea' || e.ctrlKey || e.metaKey)) { e.preventDefault(); guardar(); }
    },
    className: `campo py-1.5 ${error ? 'border-red-500/60' : ''}`,
  };
  return (
    <div className="w-full">
      <div className="flex items-start gap-1.5">
        {tipo === 'multilinea'
          ? <textarea rows={3} {...comun} />
          : <input type={tipo === 'texto' ? 'text' : 'number'} step={tipo === 'precio' ? '0.01' : '1'} min="0" {...comun} />}
        <button type="button" onClick={guardar} className="rounded-lg bg-acento p-2 text-slate-950 hover:bg-cyan-300" aria-label="Guardar"><Check className="h-4 w-4" /></button>
        <button type="button" onClick={cancelar} className="rounded-lg border border-borde p-2 text-slate-400 hover:text-white" aria-label="Cancelar"><X className="h-4 w-4" /></button>
      </div>
      <p className={`mt-1 text-[11px] ${error ? 'text-red-300' : 'text-slate-500'}`}>
        {error ?? (tipo === 'multilinea' ? 'Ctrl+Enter guarda · Esc cancela' : 'Enter guarda · Esc cancela')}
      </p>
    </div>
  );
}
