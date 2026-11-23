import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Carrusel táctil (se arrastra con el dedo o el mouse); avanza solo salvo con "reducir movimiento"
export default function Carrusel({ children, etiqueta }) {
  const reducir = useReducedMotion();
  const [ref, embla] = useEmblaCarousel({ align: 'start', loop: true, dragFree: false },
    reducir ? [] : [Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true })]);
  const [actual, setActual] = useState(0);
  const [puntos, setPuntos] = useState([]);

  const actualizar = useCallback(() => {
    if (!embla) return;
    setActual(embla.selectedScrollSnap());
    setPuntos(embla.scrollSnapList());
  }, [embla]);
  useEffect(() => {
    if (!embla) return undefined;
    actualizar();
    embla.on('select', actualizar).on('reInit', actualizar);
    return () => { embla.off('select', actualizar).off('reInit', actualizar); };
  }, [embla, actualizar]);

  const boton = 'grid h-10 w-10 place-items-center rounded-full border border-borde bg-panel/90 backdrop-blur transition hover:border-acento/60 hover:text-acento';
  return (
    <section aria-roledescription="carrusel" aria-label={etiqueta}>
      <div className="overflow-hidden px-1 py-3" ref={ref}>
        <div className="-ml-5 flex touch-pan-y">
          {children.map((hijo, i) => (
            <div key={hijo.key ?? i} className="min-w-0 shrink-0 grow-0 basis-full pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              role="group" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${children.length}`}>
              {hijo}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          {puntos.map((_, i) => (
            <button key={i} onClick={() => embla?.scrollTo(i)} aria-label={`Ir a la diapositiva ${i + 1}`} aria-current={i === actual}
              className={`h-2 rounded-full transition-all ${i === actual ? 'w-6 bg-acento' : 'w-2 bg-slate-700 hover:bg-slate-500'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button className={boton} onClick={() => embla?.scrollPrev()} aria-label="Anterior"><ChevronLeft className="h-5 w-5" /></button>
          <button className={boton} onClick={() => embla?.scrollNext()} aria-label="Siguiente"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
    </section>
  );
}
