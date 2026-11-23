import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import Campo from './Campo.jsx';
import { esquemaEnvio } from './esquemas.js';
import { soles } from '../../utils/formato.js';

export default function PasoEnvio({ inicial, tarifas, subtotal, alContinuar }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(esquemaEnvio), defaultValues: inicial, mode: 'onTouched',
  });
  const distrito = tarifas.distritos.find((d) => d.distrito === watch('distrito'));
  const gratis = subtotal >= tarifas.gratis_desde;
  const zonas = [...new Set(tarifas.distritos.map((d) => d.zona))];

  return (
    <form onSubmit={handleSubmit(alContinuar)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Campo id="nombre" etiqueta="Nombre completo" autoComplete="name" error={errors.nombre} {...register('nombre')} />
      <Campo id="telefono" etiqueta="Teléfono" inputMode="tel" autoComplete="tel" error={errors.telefono} {...register('telefono')} />
      <Campo id="direccion" etiqueta="Dirección" autoComplete="street-address" className="sm:col-span-2" error={errors.direccion} {...register('direccion')} />
      <Campo id="distrito" etiqueta="Distrito" como="select" error={errors.distrito} {...register('distrito')}>
        <option value="">Elige tu distrito…</option>
        {zonas.map((z) => (
          <optgroup key={z} label={z}>
            {tarifas.distritos.filter((d) => d.zona === z).map((d) => (
              <option key={d.distrito} value={d.distrito}>{d.distrito} · {gratis ? 'gratis' : soles(d.costo)}</option>
            ))}
          </optgroup>
        ))}
      </Campo>
      <Campo id="referencia" etiqueta="Referencia (opcional)" placeholder="Frente al parque…" error={errors.referencia} {...register('referencia')} />

      {distrito && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-acento/30 bg-acento/5 px-4 py-3 text-sm sm:col-span-2">
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-acento" />{distrito.zona}</span>
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-acento" />Llega en {distrito.dias} día{distrito.dias > 1 ? 's' : ''} hábil{distrito.dias > 1 ? 'es' : ''}</span>
          <span className="ml-auto font-semibold">{gratis ? '¡Envío gratis!' : `Envío ${soles(distrito.costo)}`}</span>
        </div>
      )}
      {!gratis && (
        <p className="text-xs text-slate-500 sm:col-span-2">Te faltan {soles(tarifas.gratis_desde - subtotal)} para el envío gratis.</p>
      )}
      <div className="flex justify-end sm:col-span-2">
        <button className="btn-primario px-6 py-3">Continuar al pago <ArrowRight className="h-4 w-4" /></button>
      </div>
    </form>
  );
}
