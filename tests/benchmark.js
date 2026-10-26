/*
 * Benchmark comparativo: misma carga contra las 3 APIs.
 *   node tests/benchmark.js                      (las 3, puertos por defecto)
 *   node tests/benchmark.js express=http://localhost:3000/api/v1
 * Genera docs/benchmark.md con la tabla de resultados.
 */
import { writeFile, mkdir } from 'node:fs/promises';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));
const OBJETIVOS = Object.keys(args).length ? args : {
  'Express + Firestore': 'http://localhost:3000/api/v1',
  'Django + PostgreSQL': 'http://localhost:8000/api/v1',
  'Rails + PostgreSQL': 'http://localhost:3001/api/v1',
};
const LECTURAS = Number(process.env.LECTURAS) || 2000;
const ESCRITURAS = Number(process.env.ESCRITURAS) || 300;
const CONCURRENCIA = Number(process.env.CONCURRENCIA) || 20;

async function llamar(base, metodo, ruta, token, body) {
  const res = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

// Ejecuta `total` peticiones manteniendo `concurrencia` en vuelo; mide la latencia de cada una
async function carga(total, concurrencia, fn) {
  const latencias = [];
  let errores = 0;
  let siguiente = 0;
  const inicio = performance.now();
  await Promise.all(Array.from({ length: concurrencia }, async () => {
    while (siguiente < total) {
      const i = siguiente++;
      const t = performance.now();
      const ok = await fn(i).catch(() => false);
      latencias.push(performance.now() - t);
      if (!ok) errores++;
    }
  }));
  const segundos = (performance.now() - inicio) / 1000;
  latencias.sort((a, b) => a - b);
  const p = (q) => latencias[Math.min(latencias.length - 1, Math.floor(q * latencias.length))];
  return { rps: total / segundos, p50: p(0.5), p95: p(0.95), errores };
}

async function medir(nombre, base) {
  const salud = await llamar(base, 'GET', '/health').catch(() => null);
  if (salud?.status !== 200) return console.log(`✗ ${nombre}: no responde en ${base}`), null;

  const admin = (await llamar(base, 'POST', '/auth/login', null, { email: 'admin@tienda.pe', password: 'Admin123*' })).json.token;
  const email = `bench_${Date.now()}@test.pe`;
  const cliente = (await llamar(base, 'POST', '/auth/register', null, { nombre: 'Bench', email, password: 'Secreta123*' })).json.token;
  const producto = (await llamar(base, 'POST', '/productos', admin, {
    sku: `BENCH-${Date.now()}`, nombre: 'Producto benchmark', precio: 10, stock: ESCRITURAS + 100, stock_minimo: 0,
  })).json;

  // Calentamiento
  await carga(50, 5, async () => (await llamar(base, 'GET', '/productos?limit=10')).status === 200);

  console.log(`→ ${nombre}`);
  const lectura = await carga(LECTURAS, CONCURRENCIA, async () =>
    (await llamar(base, 'GET', '/productos?limit=10&orden=-precio')).status === 200);
  console.log(`   lectura   ${lectura.rps.toFixed(0)} req/s  p50 ${lectura.p50.toFixed(1)} ms  p95 ${lectura.p95.toFixed(1)} ms`);

  const escritura = await carga(ESCRITURAS, CONCURRENCIA, async () =>
    (await llamar(base, 'POST', '/pedidos', cliente, { items: [{ producto_id: producto.id, cantidad: 1 }] })).status === 201);
  console.log(`   pedidos   ${escritura.rps.toFixed(0)} req/s  p50 ${escritura.p50.toFixed(1)} ms  p95 ${escritura.p95.toFixed(1)} ms`);

  const final = (await llamar(base, 'GET', `/productos/${producto.id}`)).json.stock;
  const consistente = final === 100 + escritura.errores;
  console.log(`   stock final ${final} (esperado ${100 + escritura.errores}) ${consistente ? '✓' : '✗'}`);
  return { nombre, lectura, escritura, consistente };
}

const resultados = [];
for (const [nombre, base] of Object.entries(OBJETIVOS)) {
  const r = await medir(nombre, base.replace(/\/$/, ''));
  if (r) resultados.push(r);
}

const fila = (r) => `| ${r.nombre} | ${r.lectura.rps.toFixed(0)} | ${r.lectura.p50.toFixed(1)} | ${r.lectura.p95.toFixed(1)} | ` +
  `${r.escritura.rps.toFixed(0)} | ${r.escritura.p50.toFixed(1)} | ${r.escritura.p95.toFixed(1)} | ${r.consistente ? '✅' : '❌'} |`;
const md = `# Resultados del benchmark

Fecha: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · Concurrencia: ${CONCURRENCIA} · ` +
`${LECTURAS} lecturas · ${ESCRITURAS} pedidos

| API | Lectura req/s | p50 ms | p95 ms | Pedidos req/s | p50 ms | p95 ms | Stock consistente |
|---|---|---|---|---|---|---|---|
${resultados.map(fila).join('\n')}

- **Lectura**: \`GET /productos?limit=10&orden=-precio\` (catálogo público).
- **Pedidos**: \`POST /pedidos\` concurrentes sobre el MISMO producto (peor caso: todos compiten por la misma fila/documento).
- **Stock consistente**: al terminar, el stock coincide exactamente con los pedidos aprobados.

> Los números dependen de la máquina. Express corre como 1 proceso, Django con Gunicorn (4 workers × 4 hilos)
> y Rails con Puma (2 workers × 5 hilos). Firestore corre en el **emulador local**, que es más lento que
> Firestore real en la nube; úsalo para comparar tendencias, no como cifra absoluta.
`;
await mkdir(new URL('../docs/', import.meta.url), { recursive: true });
await writeFile(new URL('../docs/benchmark.md', import.meta.url), md);
console.log('\nResultados guardados en docs/benchmark.md');
