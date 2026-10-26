// Error de negocio con código HTTP y código legible (mismo formato en las 3 APIs)
export class AppError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const noEncontrado = (recurso = 'Recurso') =>
  new AppError(404, 'NO_ENCONTRADO', `${recurso} no encontrado`);
