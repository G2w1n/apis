import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Banknote, Boxes, PackageCheck } from 'lucide-react';
import { useReporte } from '../../api/consultas.js';
import { Cargando, ErrorCaja, Vacio } from '../../components/ui.jsx';
import { ESTADOS, soles } from '../../utils/formato.js';

// Gráficos de una sola serie: un solo color (sin leyenda; el título dice qué se mide)
const COLOR_SERIE = '#22d3ee';
const EJE = { stroke: '#94a3b8', fontSize: 12 };

function Kpi({ icono: Icono, titulo, valor, detalle, alerta }) {
  return (
    <div className="tarjeta p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{titulo}</span>
        <Icono className={`h-5 w-5 ${alerta ? 'text-amber-300' : 'text-slate-500'}`} aria-hidden />
      </div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}

function Consejo({ active, payload, label, formato }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-borde bg-slate-950/95 px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-slate-100">{payload[0].payload.nombre ?? label}</p>
      <p className="text-slate-300">{formato(payload[0].value, payload[0].payload)}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: r, isLoading, isError, error, refetch } = useReporte();
  if (isLoading) return <Cargando />;
  if (isError) return <ErrorCaja error={error} reintentar={refetch} />;

  const vendidos = r.mas_vendidos.map((v) => ({ ...v, nombreCorto: v.nombre.length > 22 ? `${v.nombre.slice(0, 22)}…` : v.nombre }));
  const estados = Object.entries(r.pedidos_por_estado).map(([estado, n]) => ({ estado: ESTADOS[estado]?.texto ?? estado, n }));
  const totalPedidos = estados.reduce((s, e) => s + e.n, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icono={Banknote} titulo="Ingresos" valor={soles(r.ingresos_totales)} detalle="Pedidos no cancelados" />
        <Kpi icono={Boxes} titulo="Valor del inventario" valor={soles(r.valor_inventario)} detalle={`${r.unidades_en_stock} unidades en stock`} />
        <Kpi icono={PackageCheck} titulo="Pedidos" valor={totalPedidos} detalle={`${r.pedidos_por_estado.entregado ?? 0} entregados`} />
        <Kpi icono={AlertTriangle} titulo="Bajo stock mínimo" valor={r.productos_bajo_stock} detalle={`de ${r.total_productos} productos`} alerta={r.productos_bajo_stock > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="tarjeta p-5 lg:col-span-3">
          <h2 className="font-semibold">Productos más vendidos <span className="font-normal text-slate-500">· unidades</span></h2>
          {vendidos.length === 0 ? <Vacio titulo="Aún no hay ventas" /> : (
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <BarChart data={vendidos} layout="vertical" margin={{ left: 8, right: 24 }} barCategoryGap={10}>
                  <CartesianGrid horizontal={false} stroke="#1f2937" />
                  <XAxis type="number" allowDecimals={false} tick={EJE} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nombreCorto" width={170} tick={{ ...EJE, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} content={<Consejo formato={(v, d) => `${v} unidades · ${soles(d.ingresos)}`} />} />
                  <Bar dataKey="unidades" isAnimationActive={false} fill={COLOR_SERIE} radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="tarjeta p-5 lg:col-span-2">
          <h2 className="font-semibold">Pedidos por estado</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={estados} margin={{ top: 16, right: 8 }} barCategoryGap={14}>
                <CartesianGrid vertical={false} stroke="#1f2937" />
                <XAxis dataKey="estado" tick={EJE} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={EJE} axisLine={false} tickLine={false} width={32} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} content={<Consejo formato={(v) => `${v} pedido${v === 1 ? '' : 's'}`} />} />
                <Bar dataKey="n" isAnimationActive={false} fill={COLOR_SERIE} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Vista en tabla de los mismos datos (accesible y fácil de leer en la exposición) */}
      {vendidos.length > 0 && (
        <section className="tarjeta overflow-x-auto p-5">
          <h2 className="mb-3 font-semibold">Detalle de ventas</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-2">Producto</th><th className="py-2 text-right">Unidades</th><th className="py-2 text-right">Ingresos</th></tr>
            </thead>
            <tbody className="divide-y divide-borde/60">
              {vendidos.map((v) => (
                <tr key={v.producto_id}><td className="py-2.5">{v.nombre}</td><td className="py-2.5 text-right tabular-nums">{v.unidades}</td><td className="py-2.5 text-right tabular-nums">{soles(v.ingresos)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
