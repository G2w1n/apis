import { Router } from 'express';
import * as auditoria from '../services/auditoria.js';
import { autenticar, soloAdmin } from '../middleware/auth.js';

const r = Router();
r.get('/', autenticar, soloAdmin, async (req, res) => res.json(await auditoria.listar(req.query)));
export default r;
