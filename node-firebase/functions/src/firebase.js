import { existsSync, readFileSync } from 'node:fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from './config.js';

// Credenciales:
//  - Emulador (FIRESTORE_EMULATOR_HOST): no necesita ninguna.
//  - Cloud Functions: las pone Google automáticamente.
//  - Otro servidor (Render, etc.): pega el JSON de la cuenta de servicio en la variable FIREBASE_SERVICE_ACCOUNT
//  - Tu PC contra Firestore real: guarda ese JSON como functions/serviceAccount.json
function leerClave() {
  if (process.env.FIRESTORE_EMULATOR_HOST) return null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  const archivo = new URL('../serviceAccount.json', import.meta.url);
  return existsSync(archivo) ? JSON.parse(readFileSync(archivo, 'utf8')) : null;
}

const opciones = { projectId: config.proyectoId };
const clave = leerClave();
if (clave) Object.assign(opciones, { credential: cert(clave), projectId: clave.project_id });
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
