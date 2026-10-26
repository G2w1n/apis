import { createHash } from 'node:crypto';
import { db, col } from '../firebase.js';
import { AppError } from '../utils/AppError.js';
import * as auditoria from './auditoria.js';

// Protección contra fuerza bruta: 5 fallos seguidos bloquean esa combinación IP + email por 15 minutos.
// Se guarda en Firestore para que funcione aunque haya varias instancias de la API.
export const MAX_FALLOS = 5;
export const BLOQUEO_MS = 15 * 60_000;

const ref = (ip, email) => col.intentosLogin.doc(createHash('sha256').update(`${ip}|${email}`).digest('hex'));

export async function verificar(ip, email) {
  const doc = await ref(ip, email).get();
  const hasta = doc.exists ? doc.data().bloqueado_hasta?.toMillis?.() ?? 0 : 0;
  const restante = hasta - Date.now();
  if (restante > 0) {
    const segundos = Math.ceil(restante / 1000);
    throw new AppError(429, 'DEMASIADOS_INTENTOS',
      `Demasiados intentos fallidos. Intenta de nuevo en ${Math.ceil(segundos / 60)} minuto(s).`, undefined, { 'Retry-After': segundos });
  }
}

export async function registrarFallo(ip, email) {
  const r = ref(ip, email);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(r);
    const ahora = Date.now();
    const previo = doc.exists ? doc.data() : null;
    // Los fallos viejos (fuera de la ventana) no cuentan
    const reiniciar = !previo || ahora - previo.primer_fallo.toMillis() > BLOQUEO_MS;
    const fallos = reiniciar ? 1 : previo.fallos + 1;
    const datos = { fallos, primer_fallo: reiniciar ? new Date(ahora) : previo.primer_fallo };
    if (fallos >= MAX_FALLOS) {
      Object.assign(datos, { fallos: 0, primer_fallo: new Date(ahora), bloqueado_hasta: new Date(ahora + BLOQUEO_MS) });
      auditoria.registrar(tx, { ip }, 'auth.bloqueo', 'usuario', email, { email, minutos: BLOQUEO_MS / 60_000 });
    }
    tx.set(r, datos);
  });
}

export const limpiar = (ip, email) => ref(ip, email).delete();
