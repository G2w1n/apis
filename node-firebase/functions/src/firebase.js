import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { config } from './config.js';

// Si existe FIRESTORE_EMULATOR_HOST el SDK se conecta solo al emulador local.
if (!getApps().length) initializeApp({ projectId: config.proyectoId });

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
