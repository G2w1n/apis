// Borra los datos y carga ../../shared/seed.json (los mismos datos que usan Django y Rails)
import { readFile } from 'node:fs/promises';
import { db, col } from '../src/firebase.js';
import * as usuarios from '../src/services/usuarios.js';
import * as categorias from '../src/services/categorias.js';
import * as productos from '../src/services/productos.js';

const seed = JSON.parse(await readFile(new URL('../../../shared/seed.json', import.meta.url)));

for (const c of Object.values(col)) await db.recursiveDelete(c);

const ids = {};
for (const u of seed.usuarios) ids[u.email] = (await usuarios.registrar(u, u.rol)).usuario.id;
const cats = {};
for (const c of seed.categorias) cats[c.nombre] = (await categorias.crear(c)).id;
for (const { categoria, ...p } of seed.productos) {
  await productos.crear({ ...p, categoria_id: cats[categoria] }, ids['admin@tienda.pe']);
}
console.log(`Seed listo: ${seed.usuarios.length} usuarios, ${seed.categorias.length} categorías, ${seed.productos.length} productos`);
process.exit(0);
