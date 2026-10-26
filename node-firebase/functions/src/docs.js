// Sirve la documentación Swagger compartida por las 3 APIs (../../../shared)
import { existsSync, readFileSync } from 'node:fs';

function leer(nombre) {
  // En el repositorio está en /shared; en Cloud Functions se copia junto al código al desplegar
  for (const ruta of [`../../../shared/${nombre}`, `../${nombre}`]) {
    const url = new URL(ruta, import.meta.url);
    if (existsSync(url)) return readFileSync(url, 'utf8');
  }
  return null;
}

const archivos = {
  html: leer('docs.html'),
  js: leer('docs.js'),
  yaml: leer('openapi.yaml'),
};

// Swagger UI carga su JS y CSS desde unpkg: esta página necesita una CSP propia (más permisiva que la de la API)
const CSP_DOCS = "default-src 'self'; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self'";

export function registrarDocs(app) {
  app.get('/docs', (_req, res) => res.set('Content-Security-Policy', CSP_DOCS).type('html').send(archivos.html));
  app.get('/docs.js', (_req, res) => res.type('application/javascript').send(archivos.js));
  app.get('/openapi.yaml', (_req, res) => res.type('text/yaml').send(archivos.yaml));
}
