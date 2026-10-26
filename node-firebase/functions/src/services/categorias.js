import { db, col } from '../firebase.js';
import { AppError } from '../utils/AppError.js';
import { categoriaJSON } from '../utils/serializar.js';

export async function listar() {
  const snap = await col.categorias.orderBy('nombre').get();
  return snap.docs.map((d) => categoriaJSON(d.id, d.data()));
}

export async function crear({ nombre, descripcion }) {
  const ref = col.categorias.doc();
  const data = { nombre, descripcion, created_at: new Date() };
  try {
    await db.runTransaction(async (tx) => {
      tx.create(col.unicos.doc(`categoria:${nombre.toLowerCase()}`), { categoria_id: ref.id });
      tx.create(ref, data);
    });
  } catch (e) {
    if (e.code === 6) throw new AppError(409, 'CATEGORIA_DUPLICADA', 'Ya existe una categoría con ese nombre');
    throw e;
  }
  return categoriaJSON(ref.id, data);
}
