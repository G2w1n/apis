const moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
export const soles = (n) => moneda.format(Number(n) || 0);

export const fecha = (iso) =>
  new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// Los IDs de Firestore son largos; los de SQL son números. Mostramos algo corto y legible.
export const idCorto = (id) => (String(id).length > 8 ? String(id).slice(0, 6).toUpperCase() : `#${id}`);

export const ESTADOS = {
  pendiente: { texto: 'Pendiente', clase: 'bg-amber-400/15 text-amber-300 ring-amber-400/30' },
  pagado: { texto: 'Pagado', clase: 'bg-sky-400/15 text-sky-300 ring-sky-400/30' },
  enviado: { texto: 'Enviado', clase: 'bg-violet-400/15 text-violet-300 ring-violet-400/30' },
  entregado: { texto: 'Entregado', clase: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30' },
  cancelado: { texto: 'Cancelado', clase: 'bg-red-400/15 text-red-300 ring-red-400/30' },
};
export const FLUJO = ['pendiente', 'pagado', 'enviado', 'entregado'];
