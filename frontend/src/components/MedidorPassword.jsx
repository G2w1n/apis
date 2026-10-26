import { Check, X } from 'lucide-react';

// Las mismas reglas que valida la API (la validación real siempre ocurre en el servidor)
export const REGLAS = [
  { texto: 'Mínimo 8 caracteres', ok: (p) => p.length >= 8 },
  { texto: 'Una mayúscula', ok: (p) => /[A-Z]/.test(p) },
  { texto: 'Una minúscula', ok: (p) => /[a-z]/.test(p) },
  { texto: 'Un número', ok: (p) => /\d/.test(p) },
  { texto: 'Un símbolo (!@#*…)', ok: (p) => /[^A-Za-z0-9]/.test(p) },
];
export const passwordValida = (p) => REGLAS.every((r) => r.ok(p));

const NIVELES = [
  { texto: 'Muy débil', color: 'bg-red-500' },
  { texto: 'Débil', color: 'bg-red-500' },
  { texto: 'Regular', color: 'bg-amber-400' },
  { texto: 'Buena', color: 'bg-amber-400' },
  { texto: 'Fuerte', color: 'bg-emerald-500' },
  { texto: 'Muy fuerte', color: 'bg-emerald-500' },
];

export default function MedidorPassword({ password }) {
  const cumplidas = REGLAS.filter((r) => r.ok(password)).length;
  const nivel = NIVELES[cumplidas];
  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {REGLAS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < cumplidas ? nivel.color : 'bg-slate-800'}`} />)}
      </div>
      <p className="text-xs text-slate-400">Seguridad: <span className="font-semibold text-slate-200">{nivel.texto}</span></p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {REGLAS.map((r) => {
          const ok = r.ok(password);
          return (
            <li key={r.texto} className={`flex items-center gap-1.5 ${ok ? 'text-emerald-300' : 'text-slate-500'}`}>
              {ok ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}{r.texto}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
