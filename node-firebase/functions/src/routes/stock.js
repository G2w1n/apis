import { Router } from 'express';
import * as stock from '../services/stock.js';
import { autenticar, soloAdmin } from '../middleware/auth.js';
import { validar } from '../middleware/validar.js';
import { movimientoSchema } from '../schemas.js';

const r = Router();
r.use(autenticar, soloAdmin);
r.post('/movimientos', validar(movimientoSchema), async (req, res) =>
  res.status(201).json(await stock.registrarMovimiento(req.body, req.usuario)));
r.get('/movimientos', async (req, res) => res.json(await stock.listarMovimientos(req.query)));
r.get('/alertas', async (_req, res) => res.json({ data: await stock.alertas() }));
r.get('/reporte', async (_req, res) => res.json(await stock.reporte()));
export default r;
