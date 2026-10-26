import { Router } from 'express';
import * as usuarios from '../services/usuarios.js';
import { autenticar } from '../middleware/auth.js';
import { validar } from '../middleware/validar.js';
import { registroSchema, loginSchema } from '../schemas.js';

const r = Router();
r.post('/register', validar(registroSchema), async (req, res) => res.status(201).json(await usuarios.registrar(req.body)));
r.post('/login', validar(loginSchema), async (req, res) => res.json(await usuarios.login(req.body)));
r.get('/me', autenticar, async (req, res) => res.json(await usuarios.obtener(req.usuario.id)));
export default r;
