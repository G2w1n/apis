import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { crearCliente } from '../api/cliente.js';
import { leer, guardar } from '../utils/almacen.js';
import { useBackend } from './ApiContext.jsx';

const AuthContext = createContext(null);

// La sesión se guarda POR API: un usuario de Django no existe en Rails (son bases distintas)
export function AuthProvider({ children }) {
  const { backend, setLento } = useBackend();
  const [sesiones, setSesiones] = useState(() => leer('voltec.sesiones', {}));
  const sesion = sesiones[backend.id] ?? null;

  const actualizar = useCallback((nuevaSesion) => {
    setSesiones((prev) => {
      const siguiente = { ...prev };
      if (nuevaSesion) siguiente[backend.id] = nuevaSesion; else delete siguiente[backend.id];
      guardar('voltec.sesiones', siguiente);
      return siguiente;
    });
  }, [backend.id]);

  const api = useMemo(
    () => crearCliente(backend.base, () => sesion?.token, { alTardar: setLento, alNoAutorizado: () => actualizar(null) }),
    [backend.base, sesion?.token, setLento, actualizar],
  );

  const valor = useMemo(() => ({
    api,
    usuario: sesion?.usuario ?? null,
    esAdmin: sesion?.usuario?.rol === 'admin',
    async login(email, password) {
      const { datos } = await api('POST', '/auth/login', { body: { email, password } });
      actualizar(datos);
      return datos.usuario;
    },
    async registro(nombre, email, password) {
      const { datos } = await api('POST', '/auth/register', { body: { nombre, email, password } });
      actualizar(datos);
      return datos.usuario;
    },
    logout: () => actualizar(null),
  }), [api, sesion, actualizar]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
