import { Component, Suspense, lazy, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Laptop } from 'lucide-react';
import { useTema } from '../context/TemaContext.jsx';

// three.js pesa ~600 KB: se descarga aparte y solo en pantallas grandes con WebGL
const Laptop3D = lazy(() => import('../tres/Laptop3D.jsx'));

const hayWebGL = () => {
  try { return Boolean(document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl')); } catch { return false; }
};

function Respaldo() {
  return (
    <div className="grid h-full place-items-center">
      <Laptop className="h-40 w-40 text-acento drop-shadow-[0_0_40px_currentColor]" strokeWidth={0.8} aria-hidden />
    </div>
  );
}

// Si el 3D falla (GPU bloqueada, driver), mostramos el ícono en vez de romper la portada
class Protector extends Component {
  state = { fallo: false };
  static getDerivedStateFromError() { return { fallo: true }; }
  render() { return this.state.fallo ? <Respaldo /> : this.props.children; }
}

export default function Hero3D() {
  const reducir = useReducedMotion();
  const { tema } = useTema();
  const [puede, setPuede] = useState(false);
  useEffect(() => {
    const grande = window.matchMedia('(min-width: 1024px)');
    const revisar = () => setPuede(grande.matches && hayWebGL());
    revisar();
    grande.addEventListener('change', revisar);
    return () => grande.removeEventListener('change', revisar);
  }, []);

  return (
    <div className="relative h-[420px]" data-hero-3d={puede ? 'webgl' : 'respaldo'}>
      <div aria-hidden className="absolute inset-8 rounded-full bg-gradient-to-br from-acento/25 via-violeta/25 to-transparent blur-3xl" />
      {puede ? (
        <Protector>
          <Suspense fallback={<Respaldo />}><Laptop3D animar={!reducir} oscuro={tema === 'oscuro'} /></Suspense>
        </Protector>
      ) : <Respaldo />}
    </div>
  );
}
