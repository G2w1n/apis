import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogIn, UserPlus, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { mensajeError } from '../api/cliente.js';

const DEMO = {
  admin: { email: 'admin@tienda.pe', password: 'Admin123*' },
  cliente: { email: 'cliente@tienda.pe', password: 'Cliente123*' },
};

export default function Login() {
  const { login, registro } = useAuth();
  const navegar = useNavigate();
  const destino = useLocation().state?.desde ?? '/';
  const [modo, setModo] = useState('login');
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (datos = form) => {
    setError(null);
    setEnviando(true);
    try {
      const usuario = modo === 'registro' && datos === form
        ? await registro(datos.nombre, datos.email, datos.password)
        : await login(datos.email, datos.password);
      toast.success(`¡Hola, ${usuario.nombre.split(' ')[0]}!`);
      navegar(usuario.rol === 'admin' && destino === '/' ? '/admin' : destino);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  const campo = (nombre) => ({ value: form[nombre], onChange: (e) => setForm({ ...form, [nombre]: e.target.value }) });

  return (
    <div className="mx-auto max-w-md pt-12">
      <div className="tarjeta animate-aparecer p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-acento to-violeta text-slate-950"><Zap className="h-6 w-6" fill="currentColor" /></span>
          <h1 className="font-display text-2xl font-bold">{modo === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</h1>
          <p className="mt-1 text-sm text-slate-400">{modo === 'login' ? 'Ingresa para comprar y ver tus pedidos' : 'Solo toma unos segundos'}</p>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); entrar(); }}>
          {modo === 'registro' && (
            <div><label className="etiqueta" htmlFor="nombre">Nombre</label><input id="nombre" className="campo" required {...campo('nombre')} /></div>
          )}
          <div><label className="etiqueta" htmlFor="email">Email</label><input id="email" type="email" className="campo" required autoComplete="email" {...campo('email')} /></div>
          <div>
            <label className="etiqueta" htmlFor="password">Contraseña</label>
            <input id="password" type="password" className="campo" required minLength={modo === 'registro' ? 8 : 1} autoComplete={modo === 'login' ? 'current-password' : 'new-password'} {...campo('password')} />
          </div>
          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button className="btn-primario w-full py-3" disabled={enviando}>
            {modo === 'login' ? <><LogIn className="h-4 w-4" />{enviando ? 'Ingresando…' : 'Ingresar'}</> : <><UserPlus className="h-4 w-4" />{enviando ? 'Creando…' : 'Crear cuenta'}</>}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-400">
          {modo === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button className="font-semibold text-acento hover:underline" onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(null); }}>
            {modo === 'login' ? 'Regístrate' : 'Ingresa'}
          </button>
        </p>

        <div className="mt-6 border-t border-borde pt-5">
          <p className="mb-3 text-center text-xs uppercase tracking-wide text-slate-500">Acceso rápido para la demo</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secundario" disabled={enviando} onClick={() => entrar(DEMO.cliente)}>Cliente demo</button>
            <button className="btn-secundario" disabled={enviando} onClick={() => entrar(DEMO.admin)}>Admin demo</button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500"><Link to="/" className="hover:text-white">← Volver a la tienda</Link></p>
    </div>
  );
}
