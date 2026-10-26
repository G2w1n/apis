import { Router } from 'express';
import * as pedidos from '../services/pedidos.js';
import { autenticar, soloAdmin } from '../middleware/auth.js';
import { validar } from '../middleware/validar.js';
import { pedidoSchema, estadoSchema } from '../schemas.js';

const r = Router();
r.use(autenticar);

// Header opcional "Idempotency-Key": si el cliente reenvía la misma petición
// (doble clic, red inestable) recibe el mismo pedido en vez de crear uno duplicado.
r.post('/', validar(pedidoSchema), async (req, res) => {
  const clave = req.get('Idempotency-Key');
  const { pedido, repetido } = await pedidos.crear(req.usuario.id, req.body.items, clave);
  if (repetido) res.set('Idempotent-Replayed', 'true');
  res.status(repetido ? 200 : 201).json(pedido);
});
r.get('/', async (req, res) => res.json(await pedidos.listar(req.usuario, req.query)));
r.get('/:id', async (req, res) => res.json(await pedidos.obtener(req.params.id, req.usuario)));
r.patch('/:id/estado', soloAdmin, validar(estadoSchema), async (req, res) =>
  res.json(await pedidos.cambiarEstado(req.params.id, req.body.estado, req.usuario)));
r.post('/:id/cancelar', async (req, res) => res.json(await pedidos.cancelar(req.params.id, req.usuario)));
export default r;
