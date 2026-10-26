// Cliente HTTP de la API. Todas las APIs (Express, Django, Rails) cumplen el mismo contrato,
// así que este archivo funciona igual con cualquiera de ellas.

export class ApiError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

/**
 * @param {string} base         URL base, ej. https://g2w1n-tienda-express.onrender.com/api/v1
 * @param {() => string|null} obtenerToken
 * @param {{ alTardar?: (lento: boolean) => void, alNoAutorizado?: () => void }} eventos
 */
export function crearCliente(base, obtenerToken, { alTardar, alNoAutorizado } = {}) {
  return async function api(metodo, ruta, { body, headers = {} } = {}) {
    const token = obtenerToken();
    // Si tarda más de 4 s avisamos: en Render gratis el servidor puede estar "despertando"
    const aviso = setTimeout(() => alTardar?.(true), 4000);
    let res;
    try {
      res = await fetch(base + ruta, {
        method: metodo,
        headers: {
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con la API. Revisa que esté encendida.');
    } finally {
      clearTimeout(aviso);
      alTardar?.(false);
    }

    const datos = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && token) alNoAutorizado?.();
      const e = datos?.error ?? {};
      throw new ApiError(res.status, e.codigo ?? 'ERROR', e.mensaje ?? `Error ${res.status}`, e.detalles);
    }
    return { datos, repetido: res.headers.get('Idempotent-Replayed') === 'true' };
  };
}

// Convierte un error de la API en un texto amigable para mostrar al usuario
export function mensajeError(error) {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado';
  if (error.codigo === 'STOCK_INSUFICIENTE' && Array.isArray(error.detalles)) {
    return error.detalles.map((d) => `${d.nombre}: pediste ${d.solicitado}, quedan ${d.disponible}`).join(' · ');
  }
  if (error.codigo === 'VALIDACION' && Array.isArray(error.detalles)) {
    return error.detalles.map((d) => `${d.campo}: ${d.mensaje}`).join(' · ');
  }
  return error.message;
}
