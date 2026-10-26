import { db, col } from '../firebase.js';
import { AppError, noEncontrado } from '../utils/AppError.js';
import { aCentimos, aSoles } from '../utils/dinero.js';
import { leerPaginacion, paginar } from '../utils/paginacion.js';
import { movimientoJSON, productoJSON } from '../utils/serializar.js';
import { conCandado } from '../utils/candado.js';

// Entrada (compra a proveedor) o salida manual (merma, robo, uso interno)
export async function registrarMovimiento({ producto_id, tipo, cantidad, motivo }, usuarioId) {
  const productoRef = col.productos.doc(producto_id);
  const movRef = col.movimientos.doc();
  return conCandado([producto_id], () => db.runTransaction(async (tx) => {
    const doc = await tx.get(productoRef);
    if (!doc.exists || !doc.data().activo) throw noEncontrado('Producto');
    const p = doc.data();
    if (tipo === 'salida' && p.stock < cantidad) {
      throw new AppError(409, 'STOCK_INSUFICIENTE', 'No hay stock suficiente para esta salida', [
        { producto_id, nombre: p.nombre, solicitado: cantidad, disponible: p.stock },
      ]);
    }
    const stockResultante = tipo === 'entrada' ? p.stock + cantidad : p.stock - cantidad;
    const ahora = new Date();
    const mov = {
      producto_id, producto_nombre: p.nombre, tipo, cantidad, stock_resultante: stockResultante,
      motivo, usuario_id: usuarioId, created_at: ahora,
    };
    tx.update(productoRef, { stock: stockResultante, updated_at: ahora });
    tx.create(movRef, mov);
    return movimientoJSON(movRef.id, mov);
  }, { maxAttempts: 30 }));
}

// Kardex: historial de movimientos, del más reciente al más antiguo
export async function listarMovimientos(query) {
  let consulta = col.movimientos;
  if (query.producto_id) consulta = consulta.where('producto_id', '==', String(query.producto_id));
  const snap = await consulta.get();
  let items = snap.docs.map((d) => movimientoJSON(d.id, d.data()));
  if (query.tipo) items = items.filter((m) => m.tipo === query.tipo);
  items.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.stock_resultante - a.stock_resultante);
  return paginar(items, leerPaginacion(query));
}

// Productos en o por debajo de su stock mínimo, los más urgentes primero
export async function alertas() {
  const snap = await col.productos.where('activo', '==', true).get();
  return snap.docs
    .map((d) => productoJSON(d.id, d.data()))
    .filter((p) => p.bajo_stock)
    .map((p) => ({ ...p, faltante: p.stock_minimo - p.stock }))
    .sort((a, b) => b.faltante - a.faltante);
}

export async function reporte() {
  const [productosSnap, pedidosSnap] = await Promise.all([
    col.productos.where('activo', '==', true).get(),
    col.pedidos.get(),
  ]);
  const productos = productosSnap.docs.map((d) => d.data());

  const pedidosPorEstado = { pendiente: 0, pagado: 0, enviado: 0, entregado: 0, cancelado: 0 };
  const ventas = new Map();
  let ingresosCentimos = 0;
  for (const doc of pedidosSnap.docs) {
    const p = doc.data();
    pedidosPorEstado[p.estado]++;
    if (p.estado === 'cancelado') continue;
    ingresosCentimos += aCentimos(p.total);
    for (const it of p.items) {
      const v = ventas.get(it.producto_id) || { producto_id: it.producto_id, nombre: it.nombre, unidades: 0, ingresos: 0 };
      v.unidades += it.cantidad;
      v.ingresos += aCentimos(it.subtotal);
      ventas.set(it.producto_id, v);
    }
  }

  return {
    total_productos: productos.length,
    unidades_en_stock: productos.reduce((s, p) => s + p.stock, 0),
    valor_inventario: aSoles(productos.reduce((s, p) => s + aCentimos(p.precio) * p.stock, 0)),
    productos_bajo_stock: productos.filter((p) => p.stock <= p.stock_minimo).length,
    ingresos_totales: aSoles(ingresosCentimos),
    pedidos_por_estado: pedidosPorEstado,
    mas_vendidos: [...ventas.values()]
      .sort((a, b) => b.unidades - a.unidades)
      .slice(0, 5)
      .map((v) => ({ ...v, ingresos: aSoles(v.ingresos) })),
  };
}
