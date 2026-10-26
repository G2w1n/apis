import { Link } from 'react-router-dom';

export default function NoEncontrado() {
  return (
    <div className="pt-24 text-center">
      <p className="font-display text-7xl font-bold texto-gradiente">404</p>
      <p className="mt-4 text-slate-400">Esta página no existe.</p>
      <Link to="/" className="btn-primario mt-8">Volver al inicio</Link>
    </div>
  );
}
