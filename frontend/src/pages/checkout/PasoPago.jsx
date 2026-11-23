import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Banknote, CreditCard, Lock, Smartphone } from 'lucide-react';
import Campo from './Campo.jsx';
import TarjetaVisual from './TarjetaVisual.jsx';
import { esquemaPago } from './esquemas.js';
import { formatearNumero, formatearVencimiento, marca as marcaDe, NUMEROS_DE_PRUEBA } from './tarjeta.js';

const METODOS = [
  { id: 'tarjeta', texto: 'Tarjeta', detalle: 'Crédito o débito', icono: CreditCard },
  { id: 'yape', texto: 'Yape', detalle: 'Con código de aprobación', icono: Smartphone },
  { id: 'contraentrega', texto: 'Contraentrega', detalle: 'Pagas al recibir', icono: Banknote },
];

export default function PasoPago({ inicial, alVolver, alContinuar }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(esquemaPago), defaultValues: { metodo: 'tarjeta', ...inicial }, mode: 'onTouched', shouldUnregister: true,
  });
  const [girada, setGirada] = useState(false);
  const metodo = watch('metodo');
  const numero = watch('numero') ?? '';
  const marca = marcaDe(numero);

  // Solo sale de este paso lo que la API necesita: método y últimos 4 dígitos (nunca número ni CVV)
  const continuar = (datos) => alContinuar(datos.metodo === 'tarjeta'
    ? { metodo: 'tarjeta', tarjeta_ultimos4: datos.numero.replace(/\D/g, '').slice(-4), marca: marcaDe(datos.numero), titular: datos.titular }
    : datos.metodo === 'yape' ? { metodo: 'yape', celular: datos.celular } : { metodo: 'contraentrega' });

  return (
    <form onSubmit={handleSubmit(continuar)} noValidate>
      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="etiqueta">Método de pago</legend>
        {METODOS.map(({ id, texto, detalle, icono: Icono }) => (
          <label key={id} className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${metodo === id ? 'border-acento/60' : 'border-borde hover:border-slate-600'}`}>
            {metodo === id && <motion.span layoutId="metodo-elegido" className="absolute inset-0 rounded-xl bg-acento/10" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
            <input type="radio" value={id} className="sr-only" {...register('metodo')} />
            <Icono className={`relative h-5 w-5 ${metodo === id ? 'text-acento' : 'text-slate-500'}`} aria-hidden />
            <span className="relative"><span className="block text-sm font-semibold">{texto}</span><span className="text-xs text-slate-500">{detalle}</span></span>
          </label>
        ))}
      </fieldset>

      <AnimatePresence mode="wait">
        <motion.div key={metodo} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-6">
          {metodo === 'tarjeta' && (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <TarjetaVisual numero={numero} titular={watch('titular')} vencimiento={watch('vencimiento')} cvv={watch('cvv')} marca={marca} girada={girada} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="numero" etiqueta="Número de tarjeta" inputMode="numeric" autoComplete="cc-number" className="sm:col-span-2" error={errors.numero}
                  ayuda={`Prueba: ${NUMEROS_DE_PRUEBA.map((n) => n.numero).join(' o ')}`}
                  {...register('numero', { onChange: (e) => setValue('numero', formatearNumero(e.target.value)) })} />
                <Campo id="titular" etiqueta="Titular" autoComplete="cc-name" className="sm:col-span-2" error={errors.titular}
                  {...register('titular', { onChange: (e) => setValue('titular', e.target.value.toUpperCase()) })} />
                <Campo id="vencimiento" etiqueta="Vence (MM/AA)" inputMode="numeric" autoComplete="cc-exp" placeholder="12/29" error={errors.vencimiento}
                  {...register('vencimiento', { onChange: (e) => setValue('vencimiento', formatearVencimiento(e.target.value)) })} />
                <Campo id="cvv" etiqueta="CVV" inputMode="numeric" autoComplete="cc-csc" maxLength={4} error={errors.cvv}
                  {...register('cvv', { onBlur: () => setGirada(false) })} onFocus={() => setGirada(true)} />
              </div>
            </div>
          )}
          {metodo === 'yape' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="celular" etiqueta="Celular con Yape" inputMode="numeric" placeholder="987654321" error={errors.celular} {...register('celular')} />
              <Campo id="codigo" etiqueta="Código de aprobación" inputMode="numeric" maxLength={6} placeholder="123456" error={errors.codigo}
                ayuda="Simulado: cualquier número de 6 dígitos" {...register('codigo')} />
            </div>
          )}
          {metodo === 'contraentrega' && (
            <p className="rounded-xl border border-borde bg-white/[.03] p-4 text-sm text-slate-300">
              Pagas en efectivo o con POS cuando llegue tu pedido. Te llamaremos para coordinar la entrega.
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" />Pago simulado para el proyecto: a la API solo se envían el método y los últimos 4 dígitos.</p>
      <div className="mt-6 flex justify-between">
        <button type="button" className="btn-secundario" onClick={alVolver}><ArrowLeft className="h-4 w-4" />Envío</button>
        <button className="btn-primario px-6 py-3">Revisar pedido <ArrowRight className="h-4 w-4" /></button>
      </div>
    </form>
  );
}
