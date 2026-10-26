import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

// ---------- CORS: solo orígenes conocidos pueden llamar a la API desde el navegador ----------
const ORIGENES = [
  'https://g2w1n-voltec.onrender.com',
  'https://g2w1n-tienda-panel.onrender.com',
  'https://probandoapi-8c9b8.web.app',
  'https://probandoapi-8c9b8.firebaseapp.com',
];
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

// Sin cabecera Origin (curl, Postman, otro servidor) no aplica CORS: eso lo controla el token
export const origenPermitido = (origen) => !origen || LOCAL.test(origen) || [...ORIGENES, ...config.corsExtra].includes(origen);

export const opcionesCors = {
  origin: (origen, cb) => cb(null, origenPermitido(origen)),
  exposedHeaders: ['Idempotent-Replayed', 'Retry-After'],
};

// ---------- Límite general de peticiones por IP ----------
// Memoria del proceso: suficiente para una instancia; con varias se usaría Redis.
export const limiteGeneral = rateLimit({
  windowMs: 60_000,
  limit: config.limitePorMinuto,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path.endsWith('/health'),
  handler: (_req, _res, next, opciones) => next(new AppError(429, 'LIMITE_PETICIONES',
    'Demasiadas peticiones desde tu red. Espera un momento.', undefined, { 'Retry-After': Math.ceil(opciones.windowMs / 1000) })),
});
