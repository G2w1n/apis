// Borra los datos y carga ../../shared/seed.json (datos de ejemplo compartidos con las pruebas)
import { readFile } from 'node:fs/promises';
import { db, col, exigirCredenciales } from '../src/firebase.js';
import * as usuarios from '../src/services/usuarios.js';
import * as categorias from '../src/services/categorias.js';
import * as productos from '../src/services/productos.js';

exigirCredenciales();

const seed = JSON.parse(await readFile(new URL('../../../shared/seed.json', import.meta.url)));

// --si-vacio: no toca nada si ya hay usuarios (para ejecutarlo en cada arranque en la nube)
if (process.argv.includes('--si-vacio') && !(await col.usuarios.limit(1).get()).empty) {
  // Base ya cargada: no se borra nada. Solo se agregan los productos nuevos del seed (por SKU)
  // y se asignan las imágenes de ejemplo a los productos que aún no tienen una
  const admin = (await col.usuarios.where('email', '==', 'admin@tienda.pe').limit(1).get()).docs[0];
  let agregados = 0;
  if (admin) {
    const cats = {};
    for (const d of (await col.categorias.get()).docs) cats[d.data().nombre] = d.id;
    for (const { categoria, ...p } of seed.productos) {
      if (!(await col.productos.where('sku', '==', p.sku).limit(1).get()).empty) continue;
      cats[categoria] ??= (await categorias.crear(seed.categorias.find((c) => c.nombre === categoria) ?? { nombre: categoria }, { id: admin.id })).id;
      await productos.crear({ ...p, categoria_id: cats[categoria] }, { id: admin.id });
      agregados++;
    }
  }
  let asignadas = 0;
  for (const { sku, imagen_url: imagen } of seed.productos) {
    if (!imagen) continue;
    const snap = await col.productos.where('sku', '==', sku).get();
    for (const doc of snap.docs.filter((d) => !d.data().imagen_url)) {
      await doc.ref.update({ imagen_url: imagen });
      asignadas++;
    }
  }
  console.log(`Firestore ya tiene datos: no se ejecuta el seed (productos nuevos: ${agregados}, imágenes asignadas: ${asignadas})`);
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
