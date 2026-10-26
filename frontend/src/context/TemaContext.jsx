import { createContext, useContext, useEffect, useState } from 'react';
import { leer, guardar } from '../utils/almacen.js';

const TemaContext = createContext(null);

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(() => leer('voltec.tema', 'oscuro'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'oscuro' ? '#0b0f17' : '#f4f7fb');
    guardar('voltec.tema', tema);
  }, [tema]);
  return (
    <TemaContext.Provider value={{ tema, alternar: () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro')) }}>
      {children}
    </TemaContext.Provider>
  );
}

export const useTema = () => useContext(TemaContext);
