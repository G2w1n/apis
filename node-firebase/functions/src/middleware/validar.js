import { AppError } from '../utils/AppError.js';

// Valida req.body con un esquema Zod y reemplaza el body por los datos limpios
export const validar = (esquema) => (req, _res, next) => {
  const r = esquema.safeParse(req.body ?? {});
  if (!r.success) {
    const detalles = r.error.issues.map((i) => ({ campo: i.path.join('.') || '(body)', mensaje: i.message }));
    return next(new AppError(400, 'VALIDACION', 'Los datos enviados no son válidos', detalles));
  }
  req.body = r.data;
  next();
};
