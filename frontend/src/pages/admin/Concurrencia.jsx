import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useBackend } from '../../context/ApiContext.jsx';
import { mensajeError } from '../../api/cliente.js';

/*
 * Demo para la exposición: se crea un producto con poco stock y se lanzan muchas compras
 * AL MISMO TIEMPO. Sin control de concurrencia se venderían más unidades de las que existen.
 */
export default function Concurrencia() {
  const { api } = useAuth();
  const { backend } = useBackend();
  const cliente = useQueryClient();
  const [stock, setStock] = useState(5);
  const [compras, setCompras] = useState(20);
  const [cuadros, setCuadros] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [corriendo, setCorriendo] = useState(false);

  const lanzar = async () => {
    setCorriendo(true);
    setResultado(null);
    setCuadros(Array(compras).fill('espera'));
    try {
      const { datos: p } = await api('POST', '/productos', {
        body: { sku: `DEMO-${Date.now().toString(36).toUpperCase()}`, nombre: 'Producto demo concurrencia', precio: 99.9, stock, stock_minimo: 1 },
      });
      const inicio = performance.now();
      // Todas las peticiones salen a la vez: ninguna espera a la anterior
      const respuestas = await Promise.all(Array.from({ length: compras }, (_, i) =>
        api('POST', '/pedidos', { body: { items: [{ producto_id: p.id, cantidad: 1 }] } })
          .then(() => { setCuadros((c) => c.map((v, j) => (j === i ? 'ok' : v))); return true; })
          .catch(() => { setCuadros((c) => c.map((v, j) => (j === i ? 'no' : v))); return false; })));
      const ms = Math.round(performance.now() - inicio);
      const { datos: final } = await api('GET', `/productos/${p.id}`);
      const aprobadas = respuestas.filter(Boolean).length;
      setResultado({ aprobadas, rechazadas: compras - aprobadas, stockFinal: final.stock, ms, correcto: aprobadas === stock && final.stock === 0 });
      cliente.invalidateQueries();
    } catch (e) {
      setResultado({ error: mensajeError(e) });
    } finally {
      setCorriendo(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="tarjeta p-6">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Zap className="h-5 w-5 text-acento" />Prueba de sobreventa en vivo</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Se crea un producto con <b className="text-slate-200">{stock}</b> unidades y se lanzan <b className="text-slate-200">{compras}</b> compras simultáneas
          contra <b className="text-slate-200">{backend.nombre}</b>. Solo deben aprobarse tantas compras como unidades existan.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <div><label className="etiqueta" htmlFor="stock">Stock</label><input id="stock" type="number" min="1" max="50" className="campo w-28" value={stock} onChange={(e) => setStock(Math.max(1, Number(e.target.value)))} /></div>
          <div><label className="etiqueta" htmlFor="compras">Compras simultáneas</label><input id="compras" type="number" min="2" max="100" className="campo w-36" value={compras} onChange={(e) => setCompras(Math.max(2, Number(e.target.value)))} /></div>
          <button className="btn-primario px-6 py-3" disabled={corriendo} onClick={lanzar}>{corriendo ? 'Lanzando…' : 'Lanzar compras'}</button>
        </div>
      </section>

      {cuadros.length > 0 && (
        <section className="tarjeta p-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-2">
            {cuadros.map((estado, i) => (
              <div key={i} className={`grid aspect-square place-items-center rounded-xl text-sm font-bold transition ${
                estado === 'ok' ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_20px_-4px] shadow-emerald-400'
                  : estado === 'no' ? 'bg-red-500/80 text-red-950' : 'animate-pulse bg-slate-800 text-slate-500'}`}>
                {i + 1}
              </div>
            ))}
          </div>
          {resultado && !resultado.error && (
            <div className={`mt-6 rounded-xl border p-4 ${resultado.correcto ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className={`h-5 w-5 ${resultado.correcto ? 'text-emerald-300' : 'text-red-300'}`} />
                {resultado.correcto ? 'Sin sobreventa: se vendió exactamente el stock disponible' : 'Resultado inesperado'}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {resultado.aprobadas} aprobadas · {resultado.rechazadas} rechazadas por falta de stock · stock final {resultado.stockFinal} · {resultado.ms} ms
              </p>
            </div>
          )}
          {resultado?.error && <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{resultado.error}</p>}
        </section>
      )}
    </div>
  );
}
