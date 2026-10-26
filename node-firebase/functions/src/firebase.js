import { existsSync, readFileSync } from 'node:fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from './config.js';

// Credenciales:
//  - Emulador (FIRESTORE_EMULATOR_HOST): no necesita ninguna.
//  - Cloud Functions: las pone Google automáticamente.
//  - Tu PC contra Firestore real: descarga la clave de la cuenta de servicio como functions/serviceAccount.json
const claveLocal = new URL('../serviceAccount.json', import.meta.url);
const opciones = { projectId: config.proyectoId };
if (!process.env.FIRESTORE_EMULATOR_HOST && existsSync(claveLocal)) {
  const clave = JSON.parse(readFileSync(claveLocal, 'utf8'));
  Object.assign(opciones, { credential: cert(clave), projectId: clave.project_id });
}
if (!getApps().length) initializeApp(opciones);

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

export { FieldValue };

// Nombres de colecciones en un solo lugar
export const col = {
  usuarios: db.collection('usuarios'),
  categorias: db.collection('categorias'),
  productos: db.collection('productos'),
  pedidos: db.collection('pedidos'),
  movimientos: db.collection('movimientos_stock'),
  // Firestore no tiene restricciones UNIQUE: usamos documentos "candado"
  // cuyo ID es el valor único (ej. "sku:LAP-001"). tx.create() falla si ya existe.
  unicos: db.collection('_unicos'),
  idempotencia: db.collection('_idempotencia'),
};
