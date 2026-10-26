export function leerPaginacion(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  return { page, limit };
}

export function paginar(items, { page, limit }) {
  const total = items.length;
  return {
    data: items.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total, paginas: Math.ceil(total / limit) },
  };
}
