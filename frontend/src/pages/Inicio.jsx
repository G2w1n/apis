import { Link } from 'react-router-dom';
import { ArrowRight, Headphones, Laptop, ShieldCheck, Smartphone, Truck, Zap } from 'lucide-react';
import { useCategorias, useProductos } from '../api/consultas.js';
import TarjetaProducto from '../components/TarjetaProducto.jsx';
import { ErrorCaja } from '../components/ui.jsx';
import { GrillaEsqueleto } from '../components/Esqueletos.jsx';
import Aparecer from '../animacion/Aparecer.jsx';
import { motion } from 'framer-motion';
import Hero3D from '../components/Hero3D.jsx';
import Carrusel from '../components/Carrusel.jsx';

// El texto del hero entra en cascada
const cascada = { oculto: {}, visible: { transition: { staggerChildren: 0.09 } } };
const linea = { oculto: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

const ICONOS = { Laptops: Laptop, Celulares: Smartphone, Accesorios: Headphones };

export default function Inicio() {
  const destacados = useProductos({ limit: 8, orden: '-precio' });
  const ultimas = useProductos({ limit: 4, bajo_stock: 'true', orden: 'stock' });
  const categorias = useCategorias();

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative grid items-center gap-6 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_1fr]">
        <motion.div variants={cascada} initial="oculto" animate="visible">
          <motion.span variants={linea} className="inline-flex items-center gap-2 rounded-full border border-acento/30 bg-acento/10 px-3 py-1 text-xs font-semibold text-acento">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />Nueva temporada 2026
          </motion.span>
          <motion.h1 variants={linea} className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            La tecnología que <span className="texto-gradiente">mueve tu día</span>
          </motion.h1>
          <motion.p variants={linea} className="mt-5 max-w-xl text-lg text-slate-400">
            Laptops, celulares y accesorios de las mejores marcas, con stock en tiempo real y compra segura.
          </motion.p>
          <motion.div variants={linea} className="mt-8 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn-primario px-6 py-3 text-base">Ver catálogo <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/catalogo?bajo_stock=true" className="btn-secundario px-6 py-3 text-base">Últimas unidades</Link>
          </motion.div>
          <motion.p variants={linea} className="mt-6 text-sm text-slate-500">
            Tip: pulsa <kbd className="rounded border border-borde px-1.5 text-xs">Ctrl</kbd> + <kbd className="rounded border border-borde px-1.5 text-xs">K</kbd> para buscar cualquier cosa.
          </motion.p>
        </motion.div>
        <motion.div className="hidden lg:block" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
          <Hero3D />
        </motion.div>
      </section>

      {/* Beneficios */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icono: Truck, titulo: 'Envío a todo el Perú', texto: 'Seguimiento de tu pedido paso a paso.' },
          { icono: ShieldCheck, titulo: 'Compra segura', texto: 'Sin cobros duplicados ni sobreventa.' },
          { icono: Zap, titulo: 'Stock en tiempo real', texto: 'Lo que ves disponible, existe.' },
        ].map(({ icono: Icono, titulo, texto }) => (
          <div key={titulo} className="tarjeta flex items-start gap-4 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-acento/10 text-acento"><Icono className="h-5 w-5" /></span>
            <div><p className="font-semibold">{titulo}</p><p className="text-sm text-slate-400">{texto}</p></div>
          </div>
        ))}
      </section>

      {/* Categorías */}
      <section>
        <h2 className="mb-6 font-display text-2xl font-bold">Explora por categoría</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(categorias.data?.data ?? []).slice(0, 6).map((c) => {
            const Icono = ICONOS[c.nombre] ?? Zap;
            return (
              <Link key={c.id} to={`/catalogo?categoria=${c.id}`} className="group tarjeta flex items-center justify-between p-6 transition hover:shadow-brillo">
                <div>
                  <p className="font-display text-xl font-bold">{c.nombre}</p>
                  <p className="text-sm text-slate-400">{c.descripcion}</p>
                </div>
                <Icono className="h-10 w-10 text-slate-600 transition group-hover:scale-110 group-hover:text-acento" strokeWidth={1.25} />
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold">Lo más premium</h2>
          <Link to="/catalogo?orden=-precio" className="text-sm font-medium text-acento hover:underline">Ver todo →</Link>
        </div>
        {destacados.isLoading ? <GrillaEsqueleto /> : destacados.isError ? <ErrorCaja error={destacados.error} reintentar={destacados.refetch} /> : (
          <Carrusel etiqueta="Productos destacados">
            {(destacados.data?.data ?? []).map((p) => <TarjetaProducto key={p.id} producto={p} />)}
          </Carrusel>
        )}
      </section>
      <Vitrina titulo="🔥 Últimas unidades" consulta={ultimas} enlace="/catalogo?bajo_stock=true" />
    </div>
  );
}

function Vitrina({ titulo, consulta, enlace = '/catalogo' }) {
  const productos = consulta.data?.data ?? [];
  if (consulta.isSuccess && productos.length === 0) return null;
  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">{titulo}</h2>
        <Link to={enlace} className="text-sm font-medium text-acento hover:underline">Ver todo →</Link>
      </div>
      {consulta.isLoading ? <GrillaEsqueleto /> : consulta.isError ? <ErrorCaja error={consulta.error} reintentar={consulta.refetch} /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productos.map((p, i) => <Aparecer key={p.id} indice={i}><TarjetaProducto producto={p} /></Aparecer>)}
        </div>
      )}
    </section>
  );
}
