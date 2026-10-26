import { Router } from 'express';
import * as categorias from '../services/categorias.js';
import { autenticar, soloAdmin } from '../middleware/auth.js';
import { validar } from '../middleware/validar.js';
import { categoriaSchema } from '../schemas.js';

const r = Router();
r.get('/', async (_req, res) => res.json({ data: await categorias.listar() }));
r.post('/', autenticar, soloAdmin, validar(categoriaSchema), async (req, res) =>
  res.status(201).json(await categorias.crear(req.body)));
export default r;
