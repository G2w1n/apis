import { Router } from 'express';
import * as productos from '../services/productos.js';
import { autenticar, soloAdmin } from '../middleware/auth.js';
import { validar } from '../middleware/validar.js';
import { productoSchema, productoUpdateSchema } from '../schemas.js';

const r = Router();
// El catálogo es público; crear, editar y eliminar requiere rol admin
r.get('/', async (req, res) => res.json(await productos.listar(req.query)));
r.get('/:id', async (req, res) => res.json(await productos.obtener(req.params.id)));
r.post('/', autenticar, soloAdmin, validar(productoSchema), async (req, res) =>
  res.status(201).json(await productos.crear(req.body, req.usuario)));
const actualizar = async (req, res) => res.json(await productos.actualizar(req.params.id, req.body, req.usuario));
r.put('/:id', autenticar, soloAdmin, validar(productoUpdateSchema), actualizar);
r.patch('/:id', autenticar, soloAdmin, validar(productoUpdateSchema), actualizar);
r.delete('/:id', autenticar, soloAdmin, async (req, res) => {
  await productos.eliminar(req.params.id, req.usuario);
  res.status(204).end();
});
export default r;
