// Convierte documentos de Firestore al formato JSON del contrato común
const iso = (v) => (v?.toDate ? v.toDate().toISOString() : v instanceof Date ? v.toISOString() : v ?? null);

export const usuarioJSON = (id, u) => ({ id, nombre: u.nombre, email: u.email, rol: u.rol });

export const categoriaJSON = (id, c) => ({ id, nombre: c.nombre, descripcion: c.descripcion ?? '' });

export const productoJSON = (id, p) => ({
  id,
  sku: p.sku,
  nombre: p.nombre,
  descripcion: p.descripcion ?? '',
  precio: p.precio,
  stock: p.stock,
  stock_minimo: p.stock_minimo,
  bajo_stock: p.stock <= p.stock_minimo,
  categoria: p.categoria_id ? { id: p.categoria_id, nombre: p.categoria_nombre } : null,
  activo: p.activo,
  created_at: iso(p.created_at),
  updated_at: iso(p.updated_at),
});

export const pedidoJSON = (id, p) => ({
  id,
  usuario_id: p.usuario_id,
  estado: p.estado,
  total: p.total,
  items: p.items,
  historial: (p.historial || []).map((h) => ({ estado: h.estado, fecha: iso(h.fecha) })),
  created_at: iso(p.created_at),
});

export const movimientoJSON = (id, m) => ({
  id,
  producto_id: m.producto_id,
  producto_nombre: m.producto_nombre,
  tipo: m.tipo,
  cantidad: m.cantidad,
  stock_resultante: m.stock_resultante,
  motivo: m.motivo,
  pedido_id: m.pedido_id ?? null,
  usuario_id: m.usuario_id ?? null,
  created_at: iso(m.created_at),
});
