/*
 * Candado por clave dentro del proceso.
 * Firestore resuelve la concurrencia con reintentos: si 20 transacciones tocan el mismo
 * documento a la vez, 19 fallan, esperan y reintentan (un "documento caliente").
 * Encolando aquí las operaciones sobre el mismo producto, dentro de cada instancia se
 * ejecutan una tras otra y casi nunca chocan. La transacción sigue protegiendo el caso
 * de varias instancias en la nube, así que la corrección no depende de este candado.
 */
const colas = new Map();

export async function conCandado(claves, fn) {
  const ordenadas = [...new Set(claves)].sort();
  const anteriores = ordenadas.map((k) => colas.get(k) || Promise.resolve());
  let liberar;
  const actual = new Promise((r) => { liberar = r; });
  ordenadas.forEach((k) => colas.set(k, actual));
  try {
    await Promise.all(anteriores);
    return await fn();
  } finally {
    liberar();
    ordenadas.forEach((k) => { if (colas.get(k) === actual) colas.delete(k); });
  }
}
