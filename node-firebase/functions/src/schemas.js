import { z } from 'zod';

const texto = (max) => z.string().trim().min(1, 'Es obligatorio').max(max);
const precio = z.number({ invalid_type_error: 'Debe ser un número' }).positive('Debe ser mayor a 0').max(1_000_000)
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, 'Máximo 2 decimales');
const entero = (min) => z.number({ invalid_type_error: 'Debe ser un número' }).int('Debe ser entero').min(min);
const id = z.union([z.string().min(1), z.number()]).transform(String);

export const registroSchema = z.object({
  nombre: texto(100),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72),
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

export const pedidoSchema = z.object({
  items: z.array(z.object({ producto_id: id, cantidad: entero(1).max(1000) }))
    .min(1, 'El pedido debe tener al menos un producto').max(50),
});

export const ESTADOS = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
export const estadoSchema = z.object({ estado: z.enum(ESTADOS) });

export const movimientoSchema = z.object({
  producto_id: id,
  tipo: z.enum(['entrada', 'salida']),
  cantidad: entero(1).max(100_000),
  motivo: texto(200),
});
