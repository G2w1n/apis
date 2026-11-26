import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, GitCompareArrows, Home, LayoutDashboard, LogIn, LogOut, Moon, Package, Search, Server, ShoppingBag, Sun, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { OPCIONES, useBackend } from '../context/ApiContext.jsx';
import { useTema } from '../context/TemaContext.jsx';
import { useConsola } from '../context/ConsolaContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import ArteProducto from './ArteProducto.jsx';
import { soles } from '../utils/formato.js';

// Quita tildes y pasa a minúsculas: "Audífonos" == "audifonos"
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Distancia de edición: cuántas letras hay que cambiar para pasar de una palabra a otra ("ipone" → "iphone" = 1)
function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = temp;
    }
  }
  return fila[b.length];
}

// Puntaje de coincidencia tolerante a errores de tipeo
function puntaje(producto, consulta) {
  const texto = normalizar(`${producto.nombre} ${producto.sku} ${producto.categoria?.nombre ?? ''}`);
  const palabras = texto.split(/[^a-z0-9]+/).filter(Boolean);
  let total = 0;
  for (const termino of normalizar(consulta).split(/\s+/).filter(Boolean)) {
    if (texto.includes(termino)) { total += 3; continue; }
    const tolerancia = termino.length <= 4 ? 1 : 2;
    const mejor = Math.min(...palabras.map((p) => distancia(termino, p.slice(0, termino.length + 1))));
    if (mejor > tolerancia) return 0;
    total += 1;
  }
  return total;
}

/*
 * Paleta de comandos (Ctrl+K o ⌘K): buscar productos aunque se escriban mal, navegar y ejecutar acciones
 * sin tocar el mouse. cmdk se encarga del teclado (↑ ↓ Enter) y de la accesibilidad.
 */
export default function Paleta() {
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState('');
  const navegar = useNavigate();
  const { api, usuario, esAdmin, logout } = useAuth();
  const { backend, cambiarBackend } = useBackend();
  const { tema, alternar } = useTema();
  const consola = useConsola();
  const carrito = useCarrito();

  useEffect(() => {
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAbierta((a) => !a); }
    };
    const abrir = () => setAbierta(true);
    window.addEventListener('keydown', atajo);
    window.addEventListener('voltec:abrir-paleta', abrir);
    return () => { window.removeEventListener('keydown', atajo); window.removeEventListener('voltec:abrir-paleta', abrir); };
  }, []);

  // El catálogo se trae una vez (página por página, máx. 500) y se filtra aquí con tolerancia a errores de tipeo
  const catalogo = useQuery({
    queryKey: [backend.id, 'paleta-catalogo'],
    queryFn: async () => {
      const todos = [];
      for (let page = 1; page <= 5; page++) {
        const { datos } = await api('GET', `/productos?limit=100&page=${page}`);
        todos.push(...datos.data);
        if (page >= datos.meta.paginas) break;
      }
      return todos;
    },
    enabled: abierta,
    staleTime: 60_000,
  });
  const resultados = texto.trim()
    ? (catalogo.data ?? []).map((p) => ({ p, s: puntaje(p, texto) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 7).map((r) => r.p)
    : [];

  const ejecutar = (accion) => { setAbierta(false); setTexto(''); accion(); };
  const item = 'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 aria-selected:bg-acento/10 aria-selected:text-white';

  return (
    <Command.Dialog open={abierta} onOpenChange={setAbierta} label="Paleta de comandos" shouldFilter={false}
      overlayClassName="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[12vh] z-[71] w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-borde bg-panel shadow-2xl animate-desvanecer">
      {/* Título y descripción ocultos: los anuncia el lector de pantalla */}
      <Dialog.Title className="sr-only">Paleta de comandos</Dialog.Title>
      <Dialog.Description className="sr-only">Busca productos, navega por la tienda o ejecuta acciones</Dialog.Description>
      <div className="flex items-center gap-3 border-b border-borde px-4">
        <Search className="h-5 w-5 text-slate-500" aria-hidden />
        <Command.Input value={texto} onValueChange={setTexto} autoFocus placeholder="Busca productos, páginas o acciones…  (prueba &quot;ipone&quot;)"
          className="h-14 flex-1 bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500" />
        <kbd className="rounded-md border border-borde px-1.5 py-0.5 text-[11px] text-slate-500">Esc</kbd>
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-slate-500">
          {catalogo.isLoading ? 'Buscando…' : 'Sin resultados. Prueba otra palabra.'}
        </Command.Empty>

        {resultados.length > 0 && (
          <Command.Group heading="Productos" className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-slate-500">
            {resultados.map((p) => (
              <Command.Item key={p.id} value={`producto-${p.id}`} className={item} onSelect={() => ejecutar(() => navegar(`/producto/${p.id}`))}>
                <ArteProducto producto={p} tamano="sm" />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-slate-100">{p.nombre}</span><span className="text-xs text-slate-500">{p.categoria?.nombre} · {p.stock} en stock</span></span>
                <span className="font-semibold tabular-nums">{soles(p.precio)}</span>
              </Command.Item>
            ))}
            <Command.Item value="ver-todos" className={item} onSelect={() => ejecutar(() => navegar(`/catalogo?q=${encodeURIComponent(texto)}`))}>
              <ArrowRight className="h-4 w-4" aria-hidden />Ver todos los resultados de “{texto}” en el catálogo
            </Command.Item>
          </Command.Group>
        )}

        {!texto.trim() && (
          <>
            <Grupo titulo="Ir a">
              <Command.Item className={item} onSelect={() => ejecutar(() => navegar('/'))}><Home className="h-4 w-4" />Inicio</Command.Item>
              <Command.Item className={item} onSelect={() => ejecutar(() => navegar('/catalogo'))}><Package className="h-4 w-4" />Catálogo</Command.Item>
              <Command.Item className={item} onSelect={() => ejecutar(() => navegar('/comparar'))}><GitCompareArrows className="h-4 w-4" />Comparador</Command.Item>
              {usuario && <Command.Item className={item} onSelect={() => ejecutar(() => navegar('/mis-pedidos'))}><ShoppingBag className="h-4 w-4" />Mis pedidos</Command.Item>}
              {esAdmin && <Command.Item className={item} onSelect={() => ejecutar(() => navegar('/admin'))}><LayoutDashboard className="h-4 w-4" />Panel de administración</Command.Item>}
            </Grupo>
            <Grupo titulo="Acciones">
              <Command.Item className={item} onSelect={() => ejecutar(() => carrito.setAbierto(true))}><ShoppingBag className="h-4 w-4" />Abrir carrito ({carrito.cantidadTotal})</Command.Item>
              <Command.Item className={item} onSelect={() => ejecutar(alternar)}>{tema === 'oscuro' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}Cambiar a modo {tema === 'oscuro' ? 'claro' : 'oscuro'}</Command.Item>
              <Command.Item className={item} onSelect={() => ejecutar(consola.alternar)}><Terminal className="h-4 w-4" />Abrir consola de la API</Command.Item>
              {usuario
                ? <Command.Item className={item} onSelect={() => ejecutar(() => { navegar('/'); logout(); })}><LogOut className="h-4 w-4" />Cerrar sesión</Command.Item>
                : <Command.Item className={item} onSelect={() => ejecutar(() => navegar('/login'))}><LogIn className="h-4 w-4" />Iniciar sesión</Command.Item>}
            </Grupo>
            {OPCIONES.length > 1 && <Grupo titulo="Cambiar de API">
              {OPCIONES.map((o) => (
                <Command.Item key={o.id} className={item} onSelect={() => ejecutar(() => cambiarBackend(o.id))}>
                  <Server className="h-4 w-4" />{o.nombre}{o.id === backend.id && <span className="ml-auto text-xs text-acento">actual</span>}
                </Command.Item>
              ))}
            </Grupo>}
          </>
        )}
      </Command.List>
    </Command.Dialog>
  );
}

const Grupo = ({ titulo, children }) => (
  <Command.Group heading={titulo} className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-slate-500">
    {children}
  </Command.Group>
);
