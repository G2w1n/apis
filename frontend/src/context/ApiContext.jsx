import { createContext, useContext, useMemo, useState } from 'react';
import { leer, guardar } from '../utils/almacen.js';

// Las 3 APIs publicadas en Render cumplen el mismo contrato: se puede cambiar entre ellas en vivo
export const BACKENDS = [
  { id: 'express', nombre: 'Express + Firebase', base: 'https://g2w1n-tienda-express.onrender.com/api/v1', color: 'bg-emerald-400' },
  { id: 'django', nombre: 'Django + PostgreSQL', base: 'https://g2w1n-tienda-django.onrender.com/api/v1', color: 'bg-sky-400' },
  { id: 'rails', nombre: 'Rails + PostgreSQL', base: 'https://g2w1n-tienda-rails.onrender.com/api/v1', color: 'bg-red-400' },
];
const LOCALES = [
  { id: 'express-local', nombre: 'Express (local)', base: 'http://localhost:3000/api/v1', color: 'bg-emerald-400' },
  { id: 'django-local', nombre: 'Django (local)', base: 'http://localhost:8000/api/v1', color: 'bg-sky-400' },
  { id: 'rails-local', nombre: 'Rails (local)', base: 'http://localhost:3001/api/v1', color: 'bg-red-400' },
];
const EN_DESARROLLO = ['localhost', '127.0.0.1'].includes(window.location.hostname);
export const OPCIONES = EN_DESARROLLO ? [...LOCALES, ...BACKENDS] : BACKENDS;

const ApiContext = createContext(null);

export function ApiProvider({ children }) {
  const [backendId, setBackendId] = useState(() => {
    const guardado = leer('voltec.backend', null);
    return OPCIONES.some((o) => o.id === guardado) ? guardado : OPCIONES[0].id;
  });
  const [lento, setLento] = useState(false);

  const valor = useMemo(() => {
    const backend = OPCIONES.find((o) => o.id === backendId) ?? OPCIONES[0];
    return {
      backend,
      cambiarBackend: (id) => { setBackendId(id); guardar('voltec.backend', id); },
      lento,
      setLento,
    };
  }, [backendId, lento]);

  return <ApiContext.Provider value={valor}>{children}</ApiContext.Provider>;
}

export const useBackend = () => useContext(ApiContext);
