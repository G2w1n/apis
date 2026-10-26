import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import categoriasRoutes from './routes/categorias.js';
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import stockRoutes from './routes/stock.js';
import auditoriaRoutes from './routes/auditoria.js';
import { rutaNoEncontrada, manejarErrores } from './middleware/errores.js';
import { opcionesCors, limiteGeneral } from './middleware/seguridad.js';
import { registrarDocs } from './docs.js';

export const app = express();
app.disable('x-powered-by');
// Render y Firebase ponen un proxy delante: confiamos en él para conocer la IP real del cliente
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(opcionesCors));
app.use(limiteGeneral);
app.use(express.json({ limit: '100kb' }));

const salud = (_req, res) => res.json({ status: 'ok', framework: 'express', base_datos: 'firestore' });
app.get('/health', salud);

// Página de bienvenida: quien abra la URL base ve qué API es y qué rutas tiene
app.get('/', (_req, res) => res.json({
  api: 'Tienda API (productos, pedidos y stock)', framework: 'express', base_datos: 'firestore', version: 'v1',
  documentacion: '/docs',
  rutas: ['/api/v1/health', '/api/v1/productos', '/api/v1/categorias', '/api/v1/auth/login', '/api/v1/pedidos', '/api/v1/stock/reporte'],
  repositorio: 'https://github.com/G2w1n/apis',
}));

registrarDocs(app);

const v1 = express.Router();
v1.get('/health', salud);
v1.use('/auth', authRoutes);
v1.use('/categorias', categoriasRoutes);
v1.use('/productos', productosRoutes);
v1.use('/pedidos', pedidosRoutes);
v1.use('/stock', stockRoutes);
v1.use('/auditoria', auditoriaRoutes);
app.use('/api/v1', v1);

app.use(rutaNoEncontrada);
app.use(manejarErrores);
