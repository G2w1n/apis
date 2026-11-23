import { z } from 'zod';

const texto = (max) => z.string().trim().min(1, 'Es obligatorio').max(max);
const precio = z.number({ invalid_type_error: 'Debe ser un número' }).positive('Debe ser mayor a 0').max(1_000_000)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Máximo 2 decimales');
const entero = (min) => z.number({ invalid_type_error: 'Debe ser un número' }).int('Debe ser entero').min(min);
const id = z.union([z.string().min(1), z.number()]).transform(String);

// Contraseña fuerte: evita claves fáciles de adivinar como "12345678" o "password"
export const passwordFuerte = z.string()
  .min(8, 'Mínimo 8 caracteres').max(72)
  .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe tener al menos una minúscula')
  .regex(/\d/, 'Debe tener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe tener al menos un símbolo');

export const registroSchema = z.object({
  nombre: texto(100),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: passwordFuerte,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Es obligatorio'),
});

export const categoriaSchema = z.object({
  nombre: texto(60),
  descripcion: z.string().max(300).optional().default(''),
});

export const productoSchema = z.object({
  sku: texto(30).transform((s) => s.toUpperCase()),
  nombre: texto(120),
  descripcion: z.string().max(1000).optional().default(''),
  precio,
  stock: entero(0).optional().default(0),
  stock_minimo: entero(0).optional().default(0),
  categoria_id: id.nullable().optional(),
  // Solo http(s) o rutas relativas: bloquea "javascript:" y otros esquemas peligrosos
  imagen_url: z.string().trim().max(500)
    .regex(/^(https?:\/\/|\/)/, 'Debe ser una URL http(s) o una ruta que empiece con /')
    .nullable().optional(),
}).strict();

// El stock NO se edita directamente: solo cambia mediante movimientos (kardex)
export const productoUpdateSchema = productoSchema
  .omit({ stock: true })
  .partial()
  .extend({ stock: z.any().optional() })
  .strict()
  .superRefine((d, ctx) => {
    if (d.stock !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['stock'], message: 'El stock solo se modifica con POST /stock/movimientos' });
    }
    if (Object.keys(d).length === 0) ctx.addIssue({ code: 'custom', message: 'Envíe al menos un campo' });
  });

export const METODOS_PAGO = ['tarjeta', 'yape', 'contraentrega'];

const envioSchema = z.object({
  nombre: texto(100),
  telefono: z.string().trim().regex(/^\+?[0-9 ]{6,15}$/, 'Teléfono inválido'),
  direccion: texto(200),
  distrito: texto(60),
  referencia: z.string().trim().max(200).optional().default(''),
}).strict();

// El pago es simulado: solo se guardan los últimos 4 dígitos; cualquier otro campo (como el número completo) se rechaza
const pagoSchema = z.object({
  metodo: z.enum(METODOS_PAGO, { errorMap: () => ({ message: `Debe ser uno de: ${METODOS_PAGO.join(', ')}` }) }),
  tarjeta_ultimos4: z.string().regex(/^\d{4}$/, 'Deben ser 4 dígitos').optional(),
}).strict().superRefine((p, ctx) => {
  if (p.metodo === 'tarjeta' && !p.tarjeta_ultimos4) ctx.addIssue({ code: 'custom', path: ['tarjeta_ultimos4'], message: 'Es obligatorio para pagar con tarjeta' });
  if (p.metodo !== 'tarjeta' && p.tarjeta_ultimos4) ctx.addIssue({ code: 'custom', path: ['tarjeta_ultimos4'], message: 'Solo aplica a tarjeta' });
});

export const pedidoSchema = z.object({
  items: z.array(z.object({ producto_id: id, cantidad: entero(1).max(1000) }))
    .min(1, 'El pedido debe tener al menos un producto').max(50),
  envio: envioSchema.optional(),
  pago: pagoSchema.optional(),
}).superRefine((p, ctx) => {
  if (p.envio && !p.pago) ctx.addIssue({ code: 'custom', path: ['pago'], message: 'Indica el método de pago' });
  if (p.pago && !p.envio) ctx.addIssue({ code: 'custom', path: ['envio'], message: 'Indica los datos de envío' });
});

export const ESTADOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
export const estadoSchema = z.object({ estado: z.enum(ESTADOS) });

export const movimientoSchema = z.object({
  producto_id: id,
  tipo: z.enum(['entrada', 'salida']),
  cantidad: entero(1).max(100_000),
  motivo: texto(200),
});
