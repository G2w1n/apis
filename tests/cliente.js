// Cliente HTTP mínimo (fetch nativo de Node 20+) para probar cualquiera de las 3 APIs
export const BASE = (process.env.BASE_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');

export async function api(metodo, ruta, { token, body, headers = {} } = {}) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  return { status: res.status, body: texto ? JSON.parse(texto) : null, headers: res.headers };
}

export const unico = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

export async function login(email, password) {
  const r = await api('POST', '/auth/login', { body: { email, password } });
  if (r.status !== 200) throw new Error(`No se pudo iniciar sesión como ${email}. ¿Ejecutaste el seed? (${r.status})`);
  return r.body.token;
}

export async function nuevoCliente() {
  const email = `cliente_${unico().toLowerCase()}@test.pe`;
  const r = await api('POST', '/auth/register', { body: { nombre: 'Cliente Test', email, password: 'Secreta123' } });
  return { ...r.body, email };
}

export async function crearProducto(tokenAdmin, extra = {}) {
  const r = await api('POST', '/productos', {
    token: tokenAdmin,
    body: { sku: `T-${unico()}`, nombre: 'Producto de prueba', precio: 10.1, stock: 5, stock_minimo: 2, ...extra },
  });
  if (r.status !== 201) throw new Error(`No se pudo crear producto: ${JSON.stringify(r.body)}`);
  return r.body;
}
