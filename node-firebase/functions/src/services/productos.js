import { db, col } from '../firebase.js';
import { AppError, noEncontrado } from '../utils/AppError.js';
import { leerPaginacion, paginar } from '../utils/paginacion.js';
import { productoJSON } from '../utils/serializar.js';
import * as auditoria from './auditoria.js';

const ORDENES = { nombre: 'nombre', precio: 'precio', stock: 'stock', creado: 'created_at' };

/*
 * Firestore solo permite filtros de rango sobre un campo por consulta y no tiene
 * búsqueda por texto. Para un catálogo de tamaño moderado filtramos en memoria;
 * en producción con miles de productos se usaría Algolia/Typesense o índices compuestos.
 */
export async function listar(query) {
  const snap = await col.productos.where('activo', '==', true).get();
  let items = snap.docs.map((d) => productoJSON(d.id, d.data()));

  const q = (query.q || '').toString().trim().toLowerCase();
  if (q) items = items.filter((p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  if (query.categoria) items = items.filter((p) => p.categoria?.id === String(query.categoria));
  if (query.precio_min) items = items.filter((p) => p.precio >= Number(query.precio_min));
  if (query.precio_max) items = items.filter((p) => p.precio <= Number(query.precio_max));
  if (query.bajo_stock === 'true') items = items.filter((p) => p.bajo_stock);

  const orden = (query.orden || 'nombre').toString();
  const campo = ORDENES[orden.replace(/^-/, '')] || 'nombre';
  const dir = orden.startsWith('-') ? -1 : 1;
  items.sort((a, b) => (a[campo] > b[campo] ? dir : a[campo] < b[campo] ? -dir : 0));

  return paginar(items, leerPaginacion(query));
}

export async function obtener(id) {
  const doc = await col.productos.doc(id).get();
  if (!doc.exists || !doc.data().activo) throw noEncontrado('Producto');
  return productoJSON(doc.id, doc.data());
}

async function leerCategoria(tx, categoriaId) {
  if (!categoriaId) return { categoria_id: null, categoria_nombre: null };
  const cat = await tx.get(col.categorias.doc(categoriaId));
  if (!cat.exists) throw new AppError(422, 'CATEGORIA_INVALIDA', 'La categoría indicada no existe');
  return { categoria_id: cat.id, categoria_nombre: cat.data().nombre };
}

export async function crear(datos, actor) {
  const ref = col.productos.doc();
  const ahora = new Date();
  const { categoria_id, ...resto } = datos;
  let producto;
  try {
    await db.runTransaction(async (tx) => {
      const categoria = await leerCategoria(tx, categoria_id);
      // Desnormalizamos el nombre de la categoría: en NoSQL se evita hacer "joins"
      producto = { ...resto, ...categoria, activo: true, created_at: ahora, updated_at: ahora };
      tx.create(col.unicos.doc(`sku:${resto.sku}`), { producto_id: ref.id });
      tx.create(ref, producto);
      auditoria.registrar(tx, actor, 'producto.crear', 'producto', ref.id, { sku: producto.sku, nombre: producto.nombre, precio: producto.precio, stock: producto.stock });
      if (producto.stock > 0) {
        tx.create(col.movimientos.doc(), {
          producto_id: ref.id, producto_nombre: producto.nombre, tipo: 'entrada',
          cantidad: producto.stock, stock_resultante: producto.stock, motivo: 'Stock inicial',
          usuario_id: actor?.id ?? null, created_at: ahora,
        });
      }
    });
  } catch (e) {
    if (e.code === 6) throw new AppError(409, 'SKU_DUPLICADO', `Ya existe un producto con SKU ${resto.sku}`);
    throw e;
  }
  return productoJSON(ref.id, producto);
}

export async function actualizar(id, cambios, actor) {
  const ref = col.productos.doc(id);
  let resultado;
  try {
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      if (!doc.exists || !doc.data().activo) throw noEncontrado('Producto');
      const actual = doc.data();
      const { categoria_id, ...resto } = cambios;
      const extra = categoria_id !== undefined ? await leerCategoria(tx, categoria_id) : {};

      if (resto.sku && resto.sku !== actual.sku) {
        tx.create(col.unicos.doc(`sku:${resto.sku}`), { producto_id: id });
        tx.delete(col.unicos.doc(`sku:${actual.sku}`));
      }
      const datos = { ...resto, ...extra, updated_at: new Date() };
      tx.update(ref, datos);
      const cambiado = auditoria.diferencias(actual, datos);
      if (Object.keys(cambiado).length) auditoria.registrar(tx, actor, 'producto.actualizar', 'producto', id, { cambios: cambiado });
      resultado = { ...actual, ...datos };
    });
  } catch (e) {
    if (e.code === 6) throw new AppError(409, 'SKU_DUPLICADO', `Ya existe un producto con SKU ${cambios.sku}`);
    throw e;
  }
  return productoJSON(id, resultado);
}

// Borrado lógico: el producto desaparece del catálogo pero los pedidos y el kardex conservan su historia
export async function eliminar(id, actor) {
  const ref = col.productos.doc(id);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists || !doc.data().activo) throw noEncontrado('Producto');
    tx.update(ref, { activo: false, updated_at: new Date() });
    auditoria.registrar(tx, actor, 'producto.eliminar', 'producto', id, { sku: doc.data().sku, nombre: doc.data().nombre });
  });
}
