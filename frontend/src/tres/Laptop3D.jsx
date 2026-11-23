import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// Pantalla de la laptop: se dibuja con canvas 2D (sin descargar imágenes ni fuentes externas)
function usarTexturaPantalla(oscuro) {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    const g = c.getContext('2d');
    const fondo = g.createLinearGradient(0, 0, 1024, 640);
    fondo.addColorStop(0, '#0e7490'); fondo.addColorStop(0.55, '#4c1d95'); fondo.addColorStop(1, '#0b0f17');
    g.fillStyle = fondo; g.fillRect(0, 0, 1024, 640);
    // Brillo y "ventanas" de una interfaz
    g.fillStyle = 'rgba(255,255,255,.08)';
    [[70, 380, 260, 150], [360, 380, 260, 150], [650, 380, 300, 150]].forEach(([x, y, w, h]) => { g.beginPath(); g.roundRect(x, y, w, h, 18); g.fill(); });
    g.fillStyle = '#22d3ee'; g.beginPath(); g.roundRect(70, 120, 86, 86, 22); g.fill();
    g.fillStyle = '#0b0f17'; g.beginPath(); g.moveTo(122, 132); g.lineTo(92, 172); g.lineTo(112, 172); g.lineTo(104, 196); g.lineTo(136, 154); g.lineTo(116, 154); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.font = 'bold 92px system-ui, sans-serif'; g.fillText('VOLTEC', 180, 196);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '36px system-ui, sans-serif'; g.fillText('La tecnología que mueve tu día', 72, 300);
    const textura = new THREE.CanvasTexture(c);
    textura.colorSpace = THREE.SRGBColorSpace;
    return textura;
  }, [oscuro]);
}

function Laptop({ animar, oscuro }) {
  const grupo = useRef();
  const tapa = useRef();
  const pantalla = usarTexturaPantalla(oscuro);
  const metal = oscuro ? '#1f2937' : '#cbd5e1';

  useFrame((estado, delta) => {
    // La tapa se abre al cargar y el equipo sigue suavemente al mouse
    const abierta = -0.32;
    tapa.current.rotation.x = animar ? THREE.MathUtils.damp(tapa.current.rotation.x, abierta, 2.2, delta) : abierta;
    if (animar) {
      grupo.current.rotation.y = THREE.MathUtils.damp(grupo.current.rotation.y, -0.45 + estado.pointer.x * 0.35, 3, delta);
      grupo.current.rotation.x = THREE.MathUtils.damp(grupo.current.rotation.x, 0.12 - estado.pointer.y * 0.12, 3, delta);
    }
  });

  return (
    <group ref={grupo} rotation={[0.12, -0.45, 0]} position={[0, -0.35, 0]}>
      {/* Base con teclado y touchpad */}
      <RoundedBox args={[3.2, 0.12, 2.1]} radius={0.05} smoothness={4}>
        <meshStandardMaterial color={metal} metalness={0.7} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0.062, -0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 1.05]} />
        <meshStandardMaterial color={oscuro ? '#0b0f17' : '#94a3b8'} roughness={0.8} />
      </mesh>
      {Array.from({ length: 5 }, (_, fila) => Array.from({ length: 13 }, (_, col) => (
        <mesh key={`${fila}-${col}`} position={[-1.3 + col * 0.217, 0.075, -0.6 + fila * 0.21]}>
          <boxGeometry args={[0.17, 0.02, 0.16]} />
          <meshStandardMaterial color={oscuro ? '#111827' : '#e2e8f0'} roughness={0.6} />
        </mesh>
      )))}
      <mesh position={[0, 0.063, 0.62]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 0.6]} />
        <meshStandardMaterial color={oscuro ? '#111827' : '#e2e8f0'} roughness={0.4} />
      </mesh>
      {/* Tapa: gira desde la bisagra trasera */}
      <group ref={tapa} position={[0, 0.06, -1.05]} rotation={[animar ? -Math.PI / 2 : -0.32, 0, 0]}>
        <RoundedBox args={[3.2, 2.05, 0.08]} radius={0.05} smoothness={4} position={[0, 1.02, -0.04]}>
          <meshStandardMaterial color={metal} metalness={0.7} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 1.04, 0.002]}>
          <planeGeometry args={[2.95, 1.82]} />
          <meshBasicMaterial map={pantalla} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export default function Laptop3D({ animar = true, oscuro = true }) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 1.6, 5.2], fov: 38 }} gl={{ antialias: true, alpha: true }} aria-hidden>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <pointLight position={[-3, 1, 2]} intensity={18} color="#22d3ee" />
      <pointLight position={[3, 0, -2]} intensity={14} color="#a78bfa" />
      {animar
        ? <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.6}><Laptop animar oscuro={oscuro} /></Float>
        : <Laptop animar={false} oscuro={oscuro} />}
      <ContactShadows position={[0, -1.1, 0]} opacity={oscuro ? 0.6 : 0.35} scale={9} blur={2.6} far={3} />
    </Canvas>
  );
}
