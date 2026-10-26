import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

export const firmarToken = (id, rol) =>
  jwt.sign({ rol }, config.jwtSecret, { subject: id, expiresIn: config.jwtExpiracion });

// Verifica "Authorization: Bearer <token>" y deja req.usuario = { id, rol }
export function autenticar(req, _res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return next(new AppError(401, 'NO_AUTENTICADO', 'Se requiere un token Bearer'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.usuario = { id: payload.sub, rol: payload.rol };
    next();
  } catch {
    next(new AppError(401, 'NO_AUTENTICADO', 'Token inválido o expirado'));
  }
}

export const soloAdmin = (req, _res, next) =>
  req.usuario?.rol === 'admin'
    ? next()
    : next(new AppError(403, 'PROHIBIDO', 'Solo un administrador puede realizar esta acción'));
