// Tarifas de envío compartidas por las 3 APIs (shared/envios.json). El costo SIEMPRE lo calcula el servidor.
import { existsSync, readFileSync } from 'node:fs';
import { AppError } from '../utils/AppError.js';
import { aCentimos } from '../utils/dinero.js';

function cargar() {
  // En el repositorio está en /shared; en Cloud Functions se copia junto al código al desplegar
  for (const ruta of ['../../../../shared/envios.json', '../../envios.json']) {
    const url = new URL(ruta, import.meta.url);
    if (existsSync(url)) return JSON.parse(readFileSync(url, 'utf8'));
  }
  throw new Error('No se encontró shared/envios.json');
}

export const TARIFAS = cargar();

/** Devuelve { costoCentimos, distrito, zona, dias } o lanza 422 si no llegamos a ese distrito */
export function cotizar(distrito, subtotalCentimos) {
  const tarifa = TARIFAS.distritos.find((d) => d.distrito.toLowerCase() === distrito.trim().toLowerCase());
  if (!tarifa) {
    throw new AppError(422, 'DISTRITO_SIN_COBERTURA', `Aún no hacemos envíos a ${distrito}`,
      { distritos: TARIFAS.distritos.map((d) => d.distrito) });
  }
  const gratis = subtotalCentimos >= aCentimos(TARIFAS.gratis_desde);
  return { costoCentimos: gratis ? 0 : aCentimos(tarifa.costo), distrito: tarifa.distrito, zona: tarifa.zona, dias: tarifa.dias };
}
