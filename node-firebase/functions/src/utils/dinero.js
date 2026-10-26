// Se opera en céntimos (enteros) para evitar errores de coma flotante: 0.1 + 0.2 !== 0.3
export const aCentimos = (monto) => Math.round(Number(monto) * 100);
export const aSoles = (centimos) => Math.round(centimos) / 100;
