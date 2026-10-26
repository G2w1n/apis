import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Sin sesión → al login. Con sesión pero sin rol admin → a la tienda.
// (La seguridad real está en la API; esto solo evita mostrar pantallas que darían 401/403.)
export default function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, esAdmin } = useAuth();
  const ubicacion = useLocation();
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (soloAdmin && !esAdmin) return <Navigate to="/" replace />;
  return children;
}
