import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

// Tarjeta que se inclina siguiendo el mouse, con un brillo que se mueve encima (solo con mouse)
export default function useInclinacion({ grados = 8, activo = true } = {}) {
  const reducir = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const suave = { stiffness: 220, damping: 20, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [0, 1], [grados, -grados]), suave);
  const rotateY = useSpring(useTransform(x, [0, 1], [-grados, grados]), suave);
  const brillo = useTransform([x, y], ([px, py]) =>
    `radial-gradient(420px circle at ${px * 100}% ${py * 100}%, rgb(var(--c-acento) / .16), transparent 45%)`);

  if (!activo || reducir) return { estilo: {}, eventos: {}, brillo: null };
  return {
    estilo: { rotateX, rotateY, transformPerspective: 900 },
    brillo,
    eventos: {
      onPointerMove: (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      },
      onPointerLeave: () => { x.set(0.5); y.set(0.5); },
    },
  };
}
