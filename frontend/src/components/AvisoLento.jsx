import { Coffee } from 'lucide-react';
import { useBackend } from '../context/ApiContext.jsx';

// El plan gratuito de Render apaga el servidor tras 15 min sin uso; la primera petición tarda ~1 min
export default function AvisoLento() {
  const { lento, backend } = useBackend();
  if (!lento) return null;
  return (
    <div className="fixed inset-x-0 top-16 z-40 mx-auto w-fit animate-aparecer rounded-full border border-amber-400/30 bg-amber-950/90 px-4 py-2 text-sm text-amber-200 shadow-lg backdrop-blur">
      <Coffee className="mr-2 inline h-4 w-4" aria-hidden />
      Despertando el servidor de {backend.nombre}… puede tardar hasta 1 minuto.
    </div>
  );
}
