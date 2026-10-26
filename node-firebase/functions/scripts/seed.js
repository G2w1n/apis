// Borra los datos y carga ../../shared/seed.json (los mismos datos que usan Django y Rails)
import { readFile } from 'node:fs/promises';
import { db, col, exigirCredenciales } from '../src/firebase.js';
import * as usuarios from '../src/services/usuarios.js';
import * as categorias from '../src/services/categorias.js';
import * as productos from '../src/services/productos.js';

exigirCredenciales();

const seed = JSON.parse(await readFile(new URL('../../../shared/seed.json', import.meta.url)));

// --si-vacio: no toca nada si ya hay usuarios (para ejecutarlo en cada arranque en la nube)
if (process.argv.includes('--si-vacio') && !(await col.usuarios.limit(1).get()).empty) {
  console.log('Firestore ya tiene datos: no se ejecuta el seed');
  process.exit(0);
}

for (const c of Object.values(col)) await db.recursiveDelete(c);

const ids = {};
for (const u of seed.usuarios) ids[u.email] = (await usuarios.registrar(u, u.rol)).usuario.id;
const cats = {};
for (const c of seed.categorias) cats[c.nombre] = (await categorias.crear(c, { id: ids['admin@tienda.pe'] })).id;
for (const { categoria, ...p } of seed.productos) {
  await productos.crear({ ...p, categoria_id: cats[categoria] }, { id: ids['admin@tienda.pe'] });
}
console.log(`Seed listo: ${seed.usuarios.length} usuarios, ${seed.categorias.length} categorías, ${seed.productos.length} productos`);
process.exit(0);
