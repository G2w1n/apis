import { db, col } from '../firebase.js';
import { leerPaginacion, paginar } from '../utils/paginacion.js';
import { auditoriaJSON } from '../utils/serializar.js';

/**
 * Registra una acción. Si se pasa `tx`, queda dentro de la misma transacción que el cambio:
 * o se guardan ambos o ninguno (no puede haber un cambio sin su registro de auditoría).
 * @param {{ id?: string, ip?: string }} actor quién hizo la acción
 */
export function registrar(tx, actor, accion, entidad, entidadId, detalle = {}) {
  const ref = col.auditoria.doc();
  const datos = {
    accion, entidad, entidad_id: String(entidadId), detalle,
    usuario_id: actor?.id ?? null, ip: actor?.ip ?? null, created_at: new Date(),
  };
  return tx ? tx.create(ref, datos) : ref.set(datos);
}

// Compara antes/después y devuelve solo lo que cambió: { precio: { antes: 10, despues: 12 } }
export function diferencias(antes, cambios) {
  const resultado = {};
  for (const [campo, valor] of Object.entries(cambios)) {
    if (campo === 'updated_at' || campo === 'categoria_nombre') continue;
    if ((antes[campo] ?? null) !== (valor ?? null)) resultado[campo] = { antes: antes[campo] ?? null, despues: valor ?? null };
  }
  return resultado;
}

export async function listar(query) {
  let consulta = col.auditoria;
  if (query.entidad) consulta = consulta.where('entidad', '==', String(query.entidad));
  if (query.entidad_id) consulta = consulta.where('entidad_id', '==', String(query.entidad_id));
  if (query.accion) consulta = consulta.where('accion', '==', String(query.accion));
  const snap = await consulta.get();
  const docs = snap.docs.sort((a, b) => b.data().created_at.toMillis() - a.data().created_at.toMillis());
  const pagina = paginar(docs, leerPaginacion(query));

  // Agregamos el email de cada usuario para que el registro sea legible
  const ids = [...new Set(pagina.data.map((d) => d.data().usuario_id).filter(Boolean))];
  const usuarios = ids.length ? await db.getAll(...ids.map((id) => col.usuarios.doc(id))) : [];
  const emails = Object.fromEntries(usuarios.filter((u) => u.exists).map((u) => [u.id, u.data().email]));
  return { ...pagina, data: pagina.data.map((d) => auditoriaJSON(d.id, d.data(), emails)) };
}
