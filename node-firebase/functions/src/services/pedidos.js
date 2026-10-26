import { createHash } from 'node:crypto';
import { db, col } from '../firebase.js';
import { AppError, noEncontrado } from '../utils/AppError.js';
import { aCentimos, aSoles } from '../utils/dinero.js';
import { leerPaginacion, paginar } from '../utils/paginacion.js';
import { pedidoJSON } from '../utils/serializar.js';

// Máquina de estados: qué transiciones están permitidas desde cada estado
export const TRANSICIONES = {
  pendiente: ['pagado', 'cancelado'],
  pagado: ['enviado', 'cancelado'],
  enviado: ['entregado'],
  entregado: [],
  cancelado: [],
};

// Bajo alta concurrencia Firestore reintenta la transacción; subimos el límite por defecto (5)
const OPCIONES_TX = { maxAttempts: 30 };

// Si piden el mismo producto dos veces en un pedido, se suman las cantidades
function agruparItems(items) {
  const mapa = new Map();
  for (const { producto_id, cantidad } of items) mapa.set(producto_id, (mapa.get(producto_id) || 0) + cantidad);
  return [...mapa].map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
}

const refIdempotencia = (usuarioId, clave) =>
  col.idempotencia.doc(createHash('sha256').update(`${usuarioId}:${clave}`).digest('hex'));

/**
 * Crea un pedido de forma ATÓMICA:
 *  1. (opcional) si la Idempotency-Key ya se usó, devuelve el pedido original sin duplicarlo
 *  2. lee todos los productos dentro de la transacción
 *  3. valida existencia y stock de TODOS los items (si uno falla, no se guarda nada)
 *  4. descuenta stock, crea el pedido y registra una "salida" por item en el kardex
 * Si dos clientes compran el último producto al mismo tiempo, Firestore detecta el
 * conflicto, reintenta una de las transacciones y esta vez verá stock 0 → no hay sobreventa.
 */
export async function crear(usuarioId, itemsSolicitados, claveIdempotencia) {
  const items = agruparItems(itemsSolicitados);
  const pedidoRef = col.pedidos.doc();
  const idemRef = claveIdempotencia ? refIdempotencia(usuarioId, claveIdempotencia) : null;

  return db.runTransaction(async (tx) => {
    // --- Lecturas (Firestore exige leer todo antes de escribir) ---
    if (idemRef) {
      const previo = await tx.get(idemRef);
      if (previo.exists) {
        const p = await tx.get(col.pedidos.doc(previo.data().pedido_id));
        return { pedido: pedidoJSON(p.id, p.data()), repetido: true };
      }
    }
    const docs = await tx.getAll(...items.map((i) => col.productos.doc(i.producto_id)));

    const noDisponibles = [];
    const sinStock = [];
    docs.forEach((doc, i) => {
      const { producto_id, cantidad } = items[i];
      if (!doc.exists || !doc.data().activo) return noDisponibles.push({ producto_id });
      const { stock, nombre } = doc.data();
      if (stock < cantidad) sinStock.push({ producto_id, nombre, solicitado: cantidad, disponible: stock });
    });
    if (noDisponibles.length) {
      throw new AppError(422, 'PRODUCTO_NO_DISPONIBLE', 'Algunos productos no existen o fueron retirados', noDisponibles);
    }
    if (sinStock.length) throw new AppError(409, 'STOCK_INSUFICIENTE', 'No hay stock suficiente', sinStock);

    // --- Escrituras ---
    const ahora = new Date();
    let totalCentimos = 0;
    const lineas = docs.map((doc, i) => {
      const p = doc.data();
      const { cantidad } = items[i];
      const subtotal = aCentimos(p.precio) * cantidad;
      totalCentimos += subtotal;
      const stockResultante = p.stock - cantidad;
      tx.update(doc.ref, { stock: stockResultante, updated_at: ahora });
      tx.create(col.movimientos.doc(), {
        producto_id: doc.id, producto_nombre: p.nombre, tipo: 'salida', cantidad,
        stock_resultante: stockResultante, motivo: `Venta - pedido ${pedidoRef.id}`,
        pedido_id: pedidoRef.id, usuario_id: usuarioId, created_at: ahora,
      });
      // Guardamos una "foto" del producto: si mañana cambia el precio, el pedido no se altera
      return {
        producto_id: doc.id, sku: p.sku, nombre: p.nombre, cantidad,
        precio_unitario: p.precio, subtotal: aSoles(subtotal),
      };
    });

    const pedido = {
      usuario_id: usuarioId, estado: 'pendiente', total: aSoles(totalCentimos), items: lineas,
      historial: [{ estado: 'pendiente', fecha: ahora }], created_at: ahora,
    };
    tx.create(pedidoRef, pedido);
    if (idemRef) tx.create(idemRef, { pedido_id: pedidoRef.id, created_at: ahora });
    return { pedido: pedidoJSON(pedidoRef.id, pedido), repetido: false };
  }, OPCIONES_TX);
}

// Un cliente solo puede ver sus pedidos; si no es suyo respondemos 404 (no revelamos que existe)
function verificarAcceso(doc, usuario) {
  if (!doc.exists) throw noEncontrado('Pedido');
  if (usuario.rol !== 'admin' && doc.data().usuario_id !== usuario.id) throw noEncontrado('Pedido');
}

function validarTransicion(actual, nuevo) {
  if (!TRANSICIONES[actual].includes(nuevo)) {
    throw new AppError(422, 'TRANSICION_INVALIDA', `No se puede pasar de "${actual}" a "${nuevo}"`, {
      estado_actual: actual, permitidos: TRANSICIONES[actual],
    });
  }
}

export async function listar(usuario, query) {
  let consulta = col.pedidos;
  if (usuario.rol !== 'admin') consulta = consulta.where('usuario_id', '==', usuario.id);
  const snap = await consulta.get();
  let items = snap.docs.map((d) => pedidoJSON(d.id, d.data()));
  if (query.estado) items = items.filter((p) => p.estado === query.estado);
  items.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return paginar(items, leerPaginacion(query));
}

export async function obtener(id, usuario) {
  const doc = await col.pedidos.doc(id).get();
  verificarAcceso(doc, usuario);
  return pedidoJSON(doc.id, doc.data());
}

// Cancelar devuelve el stock de cada item y lo registra como "entrada" en el kardex
export async function cancelar(id, usuario) {
  const ref = col.pedidos.doc(id);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    verificarAcceso(doc, usuario);
    const pedido = doc.data();
    validarTransicion(pedido.estado, 'cancelado');

    const productos = await tx.getAll(...pedido.items.map((i) => col.productos.doc(i.producto_id)));
    const ahora = new Date();
    productos.forEach((p, i) => {
      if (!p.exists) return;
      const { cantidad } = pedido.items[i];
      const stockResultante = p.data().stock + cantidad;
      tx.update(p.ref, { stock: stockResultante, updated_at: ahora });
      tx.create(col.movimientos.doc(), {
        producto_id: p.id, producto_nombre: p.data().nombre, tipo: 'entrada', cantidad,
        stock_resultante: stockResultante, motivo: `Cancelación - pedido ${id}`,
        pedido_id: id, usuario_id: usuario.id, created_at: ahora,
      });
    });
    const historial = [...pedido.historial, { estado: 'cancelado', fecha: ahora }];
    tx.update(ref, { estado: 'cancelado', historial });
    return pedidoJSON(id, { ...pedido, estado: 'cancelado', historial });
  }, OPCIONES_TX);
}

export async function cambiarEstado(id, estado, usuario) {
  if (estado === 'cancelado') return cancelar(id, usuario);
  const ref = col.pedidos.doc(id);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    verificarAcceso(doc, usuario);
    const pedido = doc.data();
    validarTransicion(pedido.estado, estado);
    const historial = [...pedido.historial, { estado, fecha: new Date() }];
    tx.update(ref, { estado, historial });
    return pedidoJSON(id, { ...pedido, estado, historial });
  });
}
