import { useState } from 'react';
import { Headphones, Keyboard, Laptop, Monitor, Mouse, Package, Smartphone } from 'lucide-react';

// La API no guarda fotos: generamos una ilustración consistente según la categoría y el nombre
const ESTILOS = {
  Laptops: { icono: Laptop, fondo: 'from-cyan-500/25 via-sky-500/10 to-transparent', color: 'text-cyan-300' },
  Celulares: { icono: Smartphone, fondo: 'from-violet-500/25 via-fuchsia-500/10 to-transparent', color: 'text-violet-300' },
  Accesorios: { icono: Headphones, fondo: 'from-emerald-500/25 via-teal-500/10 to-transparent', color: 'text-emerald-300' },
};

function iconoPorNombre(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('mouse')) return Mouse;
  if (n.includes('teclado')) return Keyboard;
  if (n.includes('monitor')) return Monitor;
  return null;
}

export default function ArteProducto({ producto, tamano = 'md' }) {
  const [fallo, setFallo] = useState(false);
  const estilo = ESTILOS[producto?.categoria?.nombre] ?? { icono: Package, fondo: 'from-slate-500/25 to-transparent', color: 'text-slate-300' };
  const Icono = iconoPorNombre(producto?.nombre) ?? estilo.icono;
  const dimension = tamano === 'lg' ? 'h-72 sm:h-96' : tamano === 'sm' ? 'h-14 w-14' : 'h-44';
  const icono = tamano === 'lg' ? 'h-28 w-28' : tamano === 'sm' ? 'h-6 w-6' : 'h-16 w-16';

  // Si el producto tiene foto la mostramos; si no tiene o no carga, usamos la ilustración
  if (producto?.imagen_url && !fallo) {
    return (
      <div className={`overflow-hidden rounded-xl bg-white ${dimension}`}>
        <img src={producto.imagen_url} alt={producto.nombre} loading="lazy" onError={() => setFallo(true)}
          className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-105" />
      </div>
    );
  }
  return (
    <div className={`relative grid place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${estilo.fondo} bg-slate-900 ${dimension}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.08),transparent_60%)]" />
      <Icono className={`${icono} ${estilo.color} drop-shadow-[0_0_25px_currentColor]`} strokeWidth={1.25} aria-hidden />
      {tamano !== 'sm' && (
        <span className="absolute bottom-2 right-3 font-display text-[10px] tracking-widest text-white/30">{producto?.sku}</span>
      )}
    </div>
  );
}
