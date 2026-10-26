/*
 * Pruebas de CONTRATO: las 3 APIs (Express, Django, Rails) deben pasar exactamente estas pruebas.
 *   BASE_URL=http://localhost:3000/api/v1 node --test tests/
 * Requiere haber ejecutado el seed (usuario admin@tienda.pe).
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { api, login, nuevoCliente, crearProducto, unico, BASE, RAIZ } from './cliente.js';

const NO_EXISTE = '999999999';
let admin;
let cliente;

before(async () => {
  admin = await login('admin@tienda.pe', 'Admin123*');
  cliente = await nuevoCliente();
});

const codigo = (r) => r.body?.error?.codigo;

describe('Salud', () => {
  it('GET /health responde ok e indica el framework', async () => {
    const r = await api('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'ok');
    assert.ok(r.body.framework);
  });

  it('una ruta inexistente responde 404 con formato de error estándar', async () => {
    const r = await api('GET', '/no-existe');
    assert.equal(r.status, 404);
    assert.ok(codigo(r));
  });
});

describe('Autenticación', () => {
  it('registro crea un cliente y devuelve token', async () => {
    assert.ok(cliente.token);
    assert.equal(cliente.usuario.rol, 'cliente');
    assert.equal(cliente.usuario.password, undefined);
    assert.equal(cliente.usuario.password_hash, undefined);
  });

  it('no permite registrar el mismo email dos veces', async () => {
    const r = await api('POST', '/auth/register', { body: { nombre: 'X', email: cliente.email, password: 'Secreta123*' } });
    assert.equal(r.status, 409);
    assert.equal(codigo(r), 'EMAIL_EN_USO');
  });

  it('valida los datos del registro', async () => {
    const r = await api('POST', '/auth/register', { body: { nombre: '', email: 'no-es-email', password: '123' } });
    assert.equal(r.status, 400);
    assert.equal(codigo(r), 'VALIDACION');
    assert.ok(Array.isArray(r.body.error.detalles) && r.body.error.detalles.length >= 2);
  });

  it('login con contraseña incorrecta responde 401', async () => {
    const r = await api('POST', '/auth/login', { body: { email: 'admin@tienda.pe', password: 'incorrecta' } });
    assert.equal(r.status, 401);
    assert.equal(codigo(r), 'CREDENCIALES_INVALIDAS');
  });

  it('GET /auth/me devuelve el usuario del token', async () => {
    const r = await api('GET', '/auth/me', { token: admin });
    assert.equal(r.status, 200);
    assert.equal(r.body.email, 'admin@tienda.pe');
    assert.equal(r.body.rol, 'admin');
  });

  it('rechaza peticiones sin token o con token falso', async () => {
    assert.equal((await api('GET', '/auth/me')).status, 401);
    assert.equal((await api('GET', '/auth/me', { token: 'falso.token.jwt' })).status, 401);
  });
});

describe('Categorías', () => {
  it('lista categorías públicamente', async () => {
    const r = await api('GET', '/categorias');
    assert.equal(r.status, 200);
    assert.ok(r.body.data.length >= 3);
  });

  it('solo admin crea categorías y no se repiten', async () => {
    const nombre = `Cat ${unico()}`;
    assert.equal((await api('POST', '/categorias', { token: cliente.token, body: { nombre } })).status, 403);
    const ok = await api('POST', '/categorias', { token: admin, body: { nombre } });
    assert.equal(ok.status, 201);
    const dup = await api('POST', '/categorias', { token: admin, body: { nombre } });
    assert.equal(dup.status, 409);
    assert.equal(codigo(dup), 'CATEGORIA_DUPLICADA');
  });
});

describe('Productos', () => {
  it('lista con paginación', async () => {
    const r = await api('GET', '/productos?limit=3&page=1');
    assert.equal(r.status, 200);
    assert.equal(r.body.data.length, 3);
    assert.equal(r.body.meta.limit, 3);
    assert.ok(r.body.meta.total >= 9);
    assert.equal(r.body.meta.paginas, Math.ceil(r.body.meta.total / 3));
  });

  it('filtra por texto, categoría y rango de precio', async () => {
    const r = await api('GET', '/productos?q=laptop');
    assert.ok(r.body.data.length >= 1);
    assert.ok(r.body.data.every((p) => p.nombre.toLowerCase().includes('laptop') || p.sku.toLowerCase().includes('laptop')));

    const cats = await api('GET', '/categorias');
    const cel = cats.body.data.find((c) => c.nombre === 'Celulares');
    const porCat = await api('GET', `/productos?categoria=${cel.id}&limit=100`);
    assert.ok(porCat.body.data.length >= 3);
    assert.ok(porCat.body.data.every((p) => String(p.categoria.id) === String(cel.id)));

    const rango = await api('GET', '/productos?precio_min=1000&precio_max=2000&limit=100');
    assert.ok(rango.body.data.every((p) => p.precio >= 1000 && p.precio <= 2000));
  });

  it('ordena por precio ascendente y descendente', async () => {
    const asc = (await api('GET', '/productos?orden=precio&limit=100')).body.data.map((p) => p.precio);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    const desc = (await api('GET', '/productos?orden=-precio&limit=100')).body.data.map((p) => p.precio);
    assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
  });

  it('el precio es numérico (no string) y bajo_stock se calcula', async () => {
    const p = await crearProducto(admin, { precio: 99.9, stock: 2, stock_minimo: 5 });
    assert.equal(typeof p.precio, 'number');
    assert.equal(p.precio, 99.9);
    assert.equal(p.bajo_stock, true);
  });

  it('GET /productos/:id y 404 si no existe', async () => {
    const p = await crearProducto(admin);
    const r = await api('GET', `/productos/${p.id}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.sku, p.sku);
    const no = await api('GET', `/productos/${NO_EXISTE}`);
    assert.equal(no.status, 404);
    assert.equal(codigo(no), 'NO_ENCONTRADO');
  });

  it('solo admin puede crear productos', async () => {
    const body = { sku: `T-${unico()}`, nombre: 'X', precio: 1 };
    assert.equal((await api('POST', '/productos', { body })).status, 401);
    assert.equal((await api('POST', '/productos', { token: cliente.token, body })).status, 403);
  });

  it('valida precio, stock y SKU duplicado', async () => {
    const malo = await api('POST', '/productos', { token: admin, body: { sku: `T-${unico()}`, nombre: 'X', precio: -5, stock: 1.5 } });
    assert.equal(malo.status, 400);
    assert.equal(codigo(malo), 'VALIDACION');
    const p = await crearProducto(admin);
    const dup = await api('POST', '/productos', { token: admin, body: { sku: p.sku, nombre: 'Otro', precio: 1 } });
    assert.equal(dup.status, 409);
    assert.equal(codigo(dup), 'SKU_DUPLICADO');
  });

  it('actualiza datos pero NO permite editar el stock directamente', async () => {
    const p = await crearProducto(admin);
    const ok = await api('PATCH', `/productos/${p.id}`, { token: admin, body: { precio: 15.5, nombre: 'Renombrado' } });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.precio, 15.5);
    assert.equal(ok.body.nombre, 'Renombrado');
    const stock = await api('PATCH', `/productos/${p.id}`, { token: admin, body: { stock: 999 } });
    assert.equal(stock.status, 400);
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 5);
  });

  it('DELETE hace borrado lógico: desaparece del catálogo', async () => {
    const p = await crearProducto(admin);
    assert.equal((await api('DELETE', `/productos/${p.id}`, { token: admin })).status, 204);
    assert.equal((await api('GET', `/productos/${p.id}`)).status, 404);
  });
});

describe('Pedidos', () => {
  it('crea un pedido, calcula el total sin errores de redondeo y descuenta stock', async () => {
    const a = await crearProducto(admin, { precio: 0.1, stock: 10 });
    const b = await crearProducto(admin, { precio: 0.2, stock: 10 });
    const r = await api('POST', '/pedidos', {
      token: cliente.token,
      body: { items: [{ producto_id: a.id, cantidad: 1 }, { producto_id: b.id, cantidad: 1 }] },
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.estado, 'pendiente');
    assert.equal(r.body.total, 0.3); // 0.1 + 0.2 en JS da 0.30000000000000004
    assert.equal(r.body.items.length, 2);
    assert.equal((await api('GET', `/productos/${a.id}`)).body.stock, 9);
  });

  it('agrupa items repetidos del mismo producto', async () => {
    const p = await crearProducto(admin, { stock: 10 });
    const r = await api('POST', '/pedidos', {
      token: cliente.token,
      body: { items: [{ producto_id: p.id, cantidad: 2 }, { producto_id: p.id, cantidad: 3 }] },
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.items.length, 1);
    assert.equal(r.body.items[0].cantidad, 5);
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 5);
  });

  it('rechaza el pedido completo si falta stock (no descuenta nada)', async () => {
    const a = await crearProducto(admin, { stock: 10 });
    const b = await crearProducto(admin, { stock: 3 });
    const r = await api('POST', '/pedidos', {
      token: cliente.token,
      body: { items: [{ producto_id: a.id, cantidad: 2 }, { producto_id: b.id, cantidad: 4 }] },
    });
    assert.equal(r.status, 409);
    assert.equal(codigo(r), 'STOCK_INSUFICIENTE');
    assert.equal(r.body.error.detalles[0].disponible, 3);
    assert.equal(r.body.error.detalles[0].solicitado, 4);
    assert.equal((await api('GET', `/productos/${a.id}`)).body.stock, 10, 'el producto A no debe descontarse');
  });

  it('rechaza productos inexistentes y pedidos vacíos', async () => {
    const r = await api('POST', '/pedidos', { token: cliente.token, body: { items: [{ producto_id: NO_EXISTE, cantidad: 1 }] } });
    assert.equal(r.status, 422);
    assert.equal(codigo(r), 'PRODUCTO_NO_DISPONIBLE');
    const vacio = await api('POST', '/pedidos', { token: cliente.token, body: { items: [] } });
    assert.equal(vacio.status, 400);
  });

  it('Idempotency-Key evita pedidos duplicados por doble clic', async () => {
    const p = await crearProducto(admin, { stock: 10 });
    const opciones = { token: cliente.token, body: { items: [{ producto_id: p.id, cantidad: 2 }] }, headers: { 'Idempotency-Key': unico() } };
    const r1 = await api('POST', '/pedidos', opciones);
    const r2 = await api('POST', '/pedidos', opciones);
    assert.equal(r1.status, 201);
    assert.equal(r2.status, 200);
    assert.equal(r2.headers.get('idempotent-replayed'), 'true');
    assert.equal(String(r2.body.id), String(r1.body.id));
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 8, 'el stock se descuenta una sola vez');
  });

  it('un cliente solo ve sus propios pedidos', async () => {
    const p = await crearProducto(admin);
    const pedido = (await api('POST', '/pedidos', { token: cliente.token, body: { items: [{ producto_id: p.id, cantidad: 1 }] } })).body;
    const otro = await nuevoCliente();
    assert.equal((await api('GET', `/pedidos/${pedido.id}`, { token: otro.token })).status, 404);
    assert.equal((await api('GET', `/pedidos/${pedido.id}`, { token: cliente.token })).status, 200);
    assert.equal((await api('GET', `/pedidos/${pedido.id}`, { token: admin })).status, 200);
    const lista = await api('GET', '/pedidos', { token: otro.token });
    assert.equal(lista.body.data.length, 0);
  });

  it('respeta la máquina de estados', async () => {
    const p = await crearProducto(admin);
    const { id } = (await api('POST', '/pedidos', { token: cliente.token, body: { items: [{ producto_id: p.id, cantidad: 1 }] } })).body;
    const estado = (e, token = admin) => api('PATCH', `/pedidos/${id}/estado`, { token, body: { estado: e } });

    assert.equal((await estado('pagado', cliente.token)).status, 403, 'un cliente no cambia estados');
    assert.equal((await estado('pagado')).status, 200);
    const salto = await estado('entregado');
    assert.equal(salto.status, 422, 'no se puede saltar de pagado a entregado');
    assert.equal(codigo(salto), 'TRANSICION_INVALIDA');
    assert.equal((await estado('enviado')).status, 200);
    const fin = await estado('entregado');
    assert.equal(fin.status, 200);
    assert.deepEqual(fin.body.historial.map((h) => h.estado), ['pendiente', 'pagado', 'enviado', 'entregado']);
    assert.equal((await api('POST', `/pedidos/${id}/cancelar`, { token: admin })).status, 422, 'un pedido entregado no se cancela');
  });

  it('cancelar devuelve el stock y no se puede cancelar dos veces', async () => {
    const p = await crearProducto(admin, { stock: 5 });
    const { id } = (await api('POST', '/pedidos', { token: cliente.token, body: { items: [{ producto_id: p.id, cantidad: 3 }] } })).body;
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 2);
    const c = await api('POST', `/pedidos/${id}/cancelar`, { token: cliente.token });
    assert.equal(c.status, 200);
    assert.equal(c.body.estado, 'cancelado');
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 5);
    assert.equal((await api('POST', `/pedidos/${id}/cancelar`, { token: cliente.token })).status, 422);
  });
});

describe('Stock y kardex', () => {
  it('solo admin accede al módulo de stock', async () => {
    assert.equal((await api('GET', '/stock/alertas', { token: cliente.token })).status, 403);
  });

  it('registra entradas y salidas manuales', async () => {
    const p = await crearProducto(admin, { stock: 5 });
    const e = await api('POST', '/stock/movimientos', { token: admin, body: { producto_id: p.id, tipo: 'entrada', cantidad: 10, motivo: 'Compra a proveedor' } });
    assert.equal(e.status, 201);
    assert.equal(e.body.stock_resultante, 15);
    const s = await api('POST', '/stock/movimientos', { token: admin, body: { producto_id: p.id, tipo: 'salida', cantidad: 20, motivo: 'Merma' } });
    assert.equal(s.status, 409);
    assert.equal(codigo(s), 'STOCK_INSUFICIENTE');
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 15);
  });

  it('el kardex es consistente: cada saldo = saldo anterior ± cantidad', async () => {
    const p = await crearProducto(admin, { stock: 5 });
    await api('POST', '/stock/movimientos', { token: admin, body: { producto_id: p.id, tipo: 'entrada', cantidad: 7, motivo: 'Compra' } });
    await api('POST', '/pedidos', { token: cliente.token, body: { items: [{ producto_id: p.id, cantidad: 4 }] } });
    await api('POST', '/stock/movimientos', { token: admin, body: { producto_id: p.id, tipo: 'salida', cantidad: 1, motivo: 'Producto dañado' } });

    const r = await api('GET', `/stock/movimientos?producto_id=${p.id}`, { token: admin });
    assert.equal(r.status, 200);
    const movs = [...r.body.data].reverse(); // del más antiguo al más reciente
    assert.deepEqual(movs.map((m) => [m.tipo, m.cantidad, m.stock_resultante]), [
      ['entrada', 5, 5], ['entrada', 7, 12], ['salida', 4, 8], ['salida', 1, 7],
    ]);
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 7);
  });

  it('alertas lista productos en o bajo su stock mínimo', async () => {
    const p = await crearProducto(admin, { stock: 1, stock_minimo: 4 });
    const r = await api('GET', '/stock/alertas', { token: admin });
    assert.equal(r.status, 200);
    const alerta = r.body.data.find((x) => String(x.id) === String(p.id));
    assert.ok(alerta, 'el producto debe aparecer en alertas');
    assert.equal(alerta.faltante, 3);
    assert.ok(r.body.data.every((x) => x.stock <= x.stock_minimo));
  });

  it('reporte resume inventario y ventas', async () => {
    const r = await api('GET', '/stock/reporte', { token: admin });
    assert.equal(r.status, 200);
    for (const k of ['total_productos', 'valor_inventario', 'productos_bajo_stock', 'ingresos_totales', 'pedidos_por_estado', 'mas_vendidos']) {
      assert.ok(k in r.body, `falta ${k}`);
    }
    assert.equal(typeof r.body.valor_inventario, 'number');
    assert.ok(Array.isArray(r.body.mas_vendidos));
  });
});

describe('Concurrencia (anti-sobreventa)', () => {
  it('20 compras simultáneas de un producto con stock 5: solo 5 se aprueban', async () => {
    const p = await crearProducto(admin, { stock: 5 });
    const compradores = await Promise.all(Array.from({ length: 4 }, nuevoCliente));
    const respuestas = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        api('POST', '/pedidos', { token: compradores[i % 4].token, body: { items: [{ producto_id: p.id, cantidad: 1 }] } })),
    );
    const aprobados = respuestas.filter((r) => r.status === 201).length;
    const rechazados = respuestas.filter((r) => r.status === 409).length;
    assert.equal(aprobados, 5, `se aprobaron ${aprobados} pedidos`);
    assert.equal(rechazados, 15);
    assert.equal((await api('GET', `/productos/${p.id}`)).body.stock, 0, 'el stock nunca debe ser negativo');
  });
});

describe('Seguridad', () => {
  it('el registro exige una contraseña fuerte', async () => {
    const r = await api('POST', '/auth/register', { body: { nombre: 'Débil', email: `debil_${unico().toLowerCase()}@test.pe`, password: 'secreta123' } });
    assert.equal(r.status, 400);
    assert.equal(codigo(r), 'VALIDACION');
    assert.ok(r.body.error.detalles.some((d) => d.campo === 'password'));
  });

  it('bloquea el login tras 5 intentos fallidos (fuerza bruta)', async () => {
    const victima = await nuevoCliente();
    for (let i = 0; i < 5; i++) {
      const r = await api('POST', '/auth/login', { body: { email: victima.email, password: 'Incorrecta1!' } });
      assert.equal(r.status, 401, `intento ${i + 1}`);
    }
    const bloqueado = await api('POST', '/auth/login', { body: { email: victima.email, password: 'Incorrecta1!' } });
    assert.equal(bloqueado.status, 429);
    assert.equal(codigo(bloqueado), 'DEMASIADOS_INTENTOS');
    assert.ok(Number(bloqueado.headers.get('retry-after')) > 0, 'debe indicar cuándo reintentar');
    const correcto = await api('POST', '/auth/login', { body: { email: victima.email, password: 'Secreta123*' } });
    assert.equal(correcto.status, 429, 'mientras dure el bloqueo ni la contraseña correcta entra');
    assert.ok(await login('admin@tienda.pe', 'Admin123*'), 'otros usuarios no se ven afectados');
  });

  it('CORS solo permite orígenes conocidos', async () => {
    const preflight = (origen) => fetch(`${BASE}/productos`, {
      method: 'OPTIONS', headers: { Origin: origen, 'Access-Control-Request-Method': 'GET' },
    });
    const malo = await preflight('https://sitio-malicioso.example');
    assert.notEqual(malo.headers.get('access-control-allow-origin'), 'https://sitio-malicioso.example');
    assert.notEqual(malo.headers.get('access-control-allow-origin'), '*');
    const bueno = await preflight('https://g2w1n-voltec.onrender.com');
    assert.equal(bueno.headers.get('access-control-allow-origin'), 'https://g2w1n-voltec.onrender.com');
  });

  it('envía cabeceras de seguridad', async () => {
    const r = await api('GET', '/health');
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  });
});

describe('Imágenes de productos', () => {
  it('guarda y devuelve imagen_url', async () => {
    const p = await crearProducto(admin, { imagen_url: 'https://ejemplo.com/foto.webp' });
    assert.equal(p.imagen_url, 'https://ejemplo.com/foto.webp');
    const cambio = await api('PATCH', `/productos/${p.id}`, { token: admin, body: { imagen_url: '/img/productos/foto.webp' } });
    assert.equal(cambio.status, 200);
    assert.equal(cambio.body.imagen_url, '/img/productos/foto.webp');
    const sinImagen = await crearProducto(admin);
    assert.equal(sinImagen.imagen_url, null);
  });

  it('rechaza URLs peligrosas', async () => {
    const r = await api('POST', '/productos', { token: admin, body: { sku: `T-${unico()}`, nombre: 'X', precio: 1, imagen_url: 'javascript:alert(1)' } });
    assert.equal(r.status, 400);
    assert.equal(codigo(r), 'VALIDACION');
  });
});

describe('Auditoría', () => {
  it('registra quién cambió un producto, qué cambió y cuándo', async () => {
    const yo = (await api('GET', '/auth/me', { token: admin })).body;
    const p = await crearProducto(admin, { precio: 10.1 });
    await api('PATCH', `/productos/${p.id}`, { token: admin, body: { precio: 15.5 } });
    await api('DELETE', `/productos/${p.id}`, { token: admin });

    const r = await api('GET', `/auditoria?entidad=producto&entidad_id=${p.id}`, { token: admin });
    assert.equal(r.status, 200);
    const acciones = r.body.data.map((a) => a.accion);
    assert.ok(acciones.includes('producto.crear'));
    assert.ok(acciones.includes('producto.eliminar'));
    const cambio = r.body.data.find((a) => a.accion === 'producto.actualizar');
    assert.deepEqual(cambio.detalle.cambios.precio, { antes: 10.1, despues: 15.5 });
    assert.equal(String(cambio.usuario_id), String(yo.id));
    assert.ok(cambio.created_at);
  });

  it('registra cambios de estado de pedidos y movimientos de stock', async () => {
    const p = await crearProducto(admin, { stock: 10 });
    const pedido = (await api('POST', '/pedidos', { token: cliente.token, body: { items: [{ producto_id: p.id, cantidad: 1 }] } })).body;
    await api('PATCH', `/pedidos/${pedido.id}/estado`, { token: admin, body: { estado: 'pagado' } });
    await api('POST', '/stock/movimientos', { token: admin, body: { producto_id: p.id, tipo: 'entrada', cantidad: 3, motivo: 'Compra' } });

    const estados = await api('GET', `/auditoria?entidad=pedido&entidad_id=${pedido.id}`, { token: admin });
    const e = estados.body.data.find((a) => a.accion === 'pedido.estado');
    assert.deepEqual([e.detalle.de, e.detalle.a], ['pendiente', 'pagado']);
    const stock = await api('GET', `/auditoria?entidad=producto&entidad_id=${p.id}`, { token: admin });
    const m = stock.body.data.find((a) => a.accion === 'stock.movimiento');
    assert.equal(m.detalle.cantidad, 3);
    assert.equal(m.detalle.stock_resultante, 12); // 10 − 1 vendido + 3 de entrada
  });

  it('solo el admin puede ver la auditoría', async () => {
    assert.equal((await api('GET', '/auditoria', { token: cliente.token })).status, 403);
  });
});

describe('Documentación', () => {
  it('sirve Swagger UI en /docs y la especificación OpenAPI', async () => {
    const docs = await fetch(`${RAIZ}/docs`);
    assert.equal(docs.status, 200);
    assert.match(docs.headers.get('content-type'), /html/);
    assert.match(await docs.text(), /swagger-ui/i);
    const spec = await fetch(`${RAIZ}/openapi.yaml`);
    assert.equal(spec.status, 200);
    assert.match(await spec.text(), /openapi: 3/);
  });
});
