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
  const texto = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (texto) {
    try {
      // Acepta el JSON tal cual o codificado en base64
      return JSON.parse(texto.startsWith('{') ? texto : Buffer.from(texto, 'base64').toString('utf8'));
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido: pega el contenido COMPLETO del archivo, desde "{" hasta "}"');
    }
  }
  const archivo = new URL('../serviceAccount.json', import.meta.url);
  return existsSync(archivo) ? JSON.parse(readFileSync(archivo, 'utf8')) : null;
}

const opciones = { projectId: config.proyectoId };
const clave = leerClave();
if (clave) Object.assign(opciones, { credential: cert(clave), projectId: clave.project_id });

// Proyecto realmente usado (viene de la llave cuando se conecta a la nube)
export const proyectoActivo = opciones.projectId || process.env.GCLOUD_PROJECT || 'desconocido';

// Cloud Functions trae sus credenciales; fuera de Google hay que darlas explícitamente
export const tieneCredenciales = Boolean(process.env.FIRESTORE_EMULATOR_HOST || clave || process.env.GCLOUD_PROJECT
  || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE);

export function exigirCredenciales() {
  if (tieneCredenciales) return;
  console.error(`
✗ No hay credenciales de Firebase, así que no se puede conectar a Firestore.
  Elige una opción:
   • En Render u otro servidor: crea la variable de entorno FIREBASE_SERVICE_ACCOUNT y pega dentro
     TODO el JSON de la cuenta de servicio (Firebase → Configuración → Cuentas de servicio → Generar nueva clave privada).
   • En tu PC: guarda ese JSON como node-firebase/functions/serviceAccount.json
   • Para probar sin la nube: usa el emulador (FIRESTORE_EMULATOR_HOST=127.0.0.1:8080).
`);
  process.exit(1);
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
