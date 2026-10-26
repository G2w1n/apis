// Siluetas grises mientras llegan los datos: la página no "salta" y se siente más rápida que un spinner
const Bloque = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;

export function TarjetaEsqueleto() {
  return (
    <div className="tarjeta p-3" aria-hidden>
      <Bloque className="h-44 rounded-xl" />
      <div className="space-y-2 px-1 pt-3">
        <Bloque className="h-3 w-20" />
        <Bloque className="h-4 w-3/4" />
        <Bloque className="h-3 w-1/2" />
        <div className="flex items-end justify-between pt-3"><Bloque className="h-6 w-24" /><Bloque className="h-10 w-10 rounded-xl" /></div>
      </div>
    </div>
  );
}

export function GrillaEsqueleto({ cantidad = 4, className = 'sm:grid-cols-2 lg:grid-cols-4' }) {
  return (
    <div className={`grid gap-5 ${className}`} role="status" aria-label="Cargando productos">
      {Array.from({ length: cantidad }, (_, i) => <TarjetaEsqueleto key={i} />)}
    </div>
  );
}

export function DetalleEsqueleto() {
  return (
    <div className="grid gap-10 pt-16 lg:grid-cols-2" role="status" aria-label="Cargando producto">
      <Bloque className="h-72 rounded-2xl sm:h-96" />
      <div className="space-y-4">
        <Bloque className="h-4 w-24" /><Bloque className="h-10 w-3/4" /><Bloque className="h-12 w-40" />
        <Bloque className="h-4 w-full" /><Bloque className="h-4 w-5/6" /><Bloque className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function FilasEsqueleto({ filas = 5 }) {
  return (
    <div className="tarjeta space-y-3 p-5" role="status" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-4"><Bloque className="h-10 w-10 rounded-xl" /><Bloque className="h-4 flex-1" /><Bloque className="h-4 w-20" /></div>
      ))}
    </div>
  );
}
