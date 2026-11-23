import { Navigate, useLocation } from 'react-router-dom';
import { useIsPresent } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

// Sin sesión → al login. Con sesión pero sin rol admin → a la tienda.
// (La seguridad real está en la API; esto solo evita mostrar pantallas que darían 401/403.)
export default function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, esAdmin } = useAuth();
  const ubicacion = useLocation();
  // Durante la animación de salida esta página sigue montada unos milisegundos: si justo se cerró
  // la sesión, no debe redirigir (lo haría en bucle hacia /login desde una página que ya se fue)
  const presente = useIsPresent();
  if (!presente) return children;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (soloAdmin && !esAdmin) return <Navigate to="/" replace />;
  return children;
}
