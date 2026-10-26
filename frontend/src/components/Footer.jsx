import { Github, Zap } from 'lucide-react';
import { useBackend } from '../context/ApiContext.jsx';

export default function Footer() {
  const { backend } = useBackend();
  return (
    <footer className="mt-24 border-t border-borde">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2"><Zap className="h-4 w-4 text-acento" />Voltec · Proyecto de Desarrollo de Aplicaciones Web</p>
        <p>Frontend en React · Conectado a <span className="text-slate-300">{backend.nombre}</span></p>
        <a href="https://github.com/G2w1n/apis" className="flex items-center gap-1.5 hover:text-white" target="_blank" rel="noreferrer">
          <Github className="h-4 w-4" />Código fuente
        </a>
      </div>
    </footer>
  );
}
