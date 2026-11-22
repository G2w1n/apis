import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Guarda las últimas peticiones a la API para mostrarlas en la consola (útil para la exposición)
const ConsolaContext = createContext(null);
const MAXIMO = 60;
let siguienteId = 1;

// Nunca mostramos contraseñas, ni siquiera en la consola del propio usuario
const ocultar = (valor) => {
  if (!valor || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) return valor.map(ocultar);
  return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, /password|token/i.test(k) ? '••••••' : ocultar(v)]));
};

export function ConsolaProvider({ children }) {
  const [registros, setRegistros] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [noLeidos, setNoLeidos] = useState(0);

  const registrar = useCallback((r) => {
    setRegistros((prev) => [{ ...r, id: siguienteId++, envio: ocultar(r.envio), respuesta: ocultar(r.respuesta) }, ...prev].slice(0, MAXIMO));
    setNoLeidos((n) => n + 1);
  }, []);

  const valor = useMemo(() => ({
    registros, registrar, abierta,
    noLeidos: abierta ? 0 : noLeidos,
    alternar: () => { setAbierta((a) => !a); setNoLeidos(0); },
    limpiar: () => setRegistros([]),
  }), [registros, registrar, abierta, noLeidos]);

  return <ConsolaContext.Provider value={valor}>{children}</ConsolaContext.Provider>;
}

export const useConsola = () => useContext(ConsolaContext);
