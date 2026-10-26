import { AppError } from '../utils/AppError.js';

export const rutaNoEncontrada = (req, _res, next) =>
  next(new AppError(404, 'RUTA_NO_ENCONTRADA', `No existe ${req.method} ${req.path}`));

// Manejador final: todas las respuestas de error tienen la forma { error: { codigo, mensaje, detalles? } }
// eslint-disable-next-line no-unused-vars
export function manejarErrores(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { codigo: err.codigo, mensaje: err.message, ...(err.detalles && { detalles: err.detalles }) },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo no es JSON válido' } });
  }
  // Firestore aborta la transacción si hubo demasiada contención sobre el mismo documento
  if (err.code === 10 /* ABORTED */) {
    return res.status(409).json({
      error: { codigo: 'CONFLICTO_CONCURRENCIA', mensaje: 'Demasiadas operaciones simultáneas, intente de nuevo' },
    });
  }
  console.error(err);
  res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' } });
}
