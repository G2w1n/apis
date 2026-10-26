import bcrypt from 'bcryptjs';
import { db, col } from '../firebase.js';
import { AppError } from '../utils/AppError.js';
import { firmarToken } from '../middleware/auth.js';
import { usuarioJSON } from '../utils/serializar.js';
import * as intentos from './intentosLogin.js';

export async function registrar({ nombre, email, password }, rol = 'cliente') {
  const ref = col.usuarios.doc();
  const usuario = { nombre, email, rol, password_hash: await bcrypt.hash(password, 10), created_at: new Date() };
  try {
    // El candado "email:..." garantiza que no haya dos cuentas con el mismo correo
    await db.runTransaction(async (tx) => {
      tx.create(col.unicos.doc(`email:${email}`), { usuario_id: ref.id });
      tx.create(ref, usuario);
    });
  } catch (e) {
    if (e.code === 6 /* ALREADY_EXISTS */) throw new AppError(409, 'EMAIL_EN_USO', 'El email ya está registrado');
    throw e;
  }
  return { usuario: usuarioJSON(ref.id, usuario), token: firmarToken(ref.id, rol) };
}

export async function login({ email, password }, ip) {
  await intentos.verificar(ip, email); // 429 si esta IP + email está bloqueada
  const snap = await col.usuarios.where('email', '==', email).limit(1).get();
  const doc = snap.docs[0];
  if (!doc || !(await bcrypt.compare(password, doc.data().password_hash))) {
    await intentos.registrarFallo(ip, email);
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos');
  }
  await intentos.limpiar(ip, email);
  const u = doc.data();
  return { usuario: usuarioJSON(doc.id, u), token: firmarToken(doc.id, u.rol) };
}

export async function obtener(id) {
  const doc = await col.usuarios.doc(id).get();
  if (!doc.exists) throw new AppError(401, 'NO_AUTENTICADO', 'El usuario ya no existe');
  return usuarioJSON(doc.id, doc.data());
}
