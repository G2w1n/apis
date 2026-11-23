// Utilidades del pago simulado. El número completo NUNCA sale del navegador: a la API solo van los últimos 4 dígitos.

// Algoritmo de Luhn: detecta errores de tipeo en números de tarjeta (lo usan todas las tarjetas reales)
export function luhnValido(numero) {
  const digitos = numero.replace(/\D/g, '');
  if (digitos.length < 13 || digitos.length > 19) return false;
  let suma = 0;
  for (let i = 0; i < digitos.length; i++) {
    let d = Number(digitos[digitos.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    suma += d;
  }
  return suma % 10 === 0;
}

export function marca(numero) {
  const n = numero.replace(/\D/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return null;
}

// "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5)
export function formatearNumero(valor) {
  const n = valor.replace(/\D/g, '').slice(0, 19);
  const grupos = marca(n) === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const partes = [];
  let i = 0;
  for (const g of grupos) { if (i >= n.length) break; partes.push(n.slice(i, i + g)); i += g; }
  return partes.join(' ');
}

export function formatearVencimiento(valor) {
  const n = valor.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

export function vencimientoValido(valor) {
  const [mm, aa] = valor.split('/').map(Number);
  if (!mm || mm > 12 || aa === undefined || Number.isNaN(aa)) return false;
  const hoy = new Date();
  const fin = new Date(2000 + aa, mm, 1); // primer día del mes siguiente
  return fin > hoy;
}

export const NUMEROS_DE_PRUEBA = [
  { marca: 'Visa', numero: '4242 4242 4242 4242' },
  { marca: 'Mastercard', numero: '5555 5555 5555 4444' },
];
