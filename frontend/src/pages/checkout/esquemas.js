import { z } from 'zod';
import { luhnValido, vencimientoValido } from './tarjeta.js';

// Las mismas reglas que valida la API (la validación definitiva siempre ocurre en el servidor)
export const esquemaEnvio = z.object({
  nombre: z.string().trim().min(3, 'Escribe tu nombre completo').max(100),
  telefono: z.string().trim().regex(/^\+?[0-9 ]{6,15}$/, 'Teléfono inválido (solo números, ej. 987654321)'),
  direccion: z.string().trim().min(5, 'Escribe la dirección completa').max(200),
  distrito: z.string().min(1, 'Elige un distrito'),
  referencia: z.string().trim().max(200).optional(),
});

export const esquemaPago = z.discriminatedUnion('metodo', [
  z.object({
    metodo: z.literal('tarjeta'),
    numero: z.string().refine(luhnValido, 'Número de tarjeta inválido'),
    titular: z.string().trim().min(3, 'Como aparece en la tarjeta'),
    vencimiento: z.string().refine(vencimientoValido, 'Fecha inválida o vencida (MM/AA)'),
    cvv: z.string().regex(/^\d{3,4}$/, '3 o 4 dígitos'),
  }),
  z.object({
    metodo: z.literal('yape'),
    celular: z.string().regex(/^9\d{8}$/, 'Celular de 9 dígitos que empiece con 9'),
    codigo: z.string().regex(/^\d{6}$/, 'Código de aprobación de 6 dígitos'),
  }),
  z.object({ metodo: z.literal('contraentrega') }),
]);
