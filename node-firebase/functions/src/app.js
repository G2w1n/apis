import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import categoriasRoutes from './routes/categorias.js';
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import stockRoutes from './routes/stock.js';
import { rutaNoEncontrada, manejarErrores } from './middleware/errores.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ exposedHeaders: ['Idempotent-Replayed'] }));
app.use(express.json({ limit: '100kb' }));

const salud = (_req, res) => res.json({ status: 'ok', framework: 'express', base_datos: 'firestore' });
app.get('/health', salud);

// Página de bienvenida: quien abra la URL base ve qué API es y qué rutas tiene
app.get('/', (_req, res) => res.json({
  api: 'Tienda API (productos, pedidos y stock)', framework: 'express', base_datos: 'firestore', version: 'v1',
  rutas: ['/api/v1/health', '/api/v1/productos', '/api/v1/categorias', '/api/v1/auth/login', '/api/v1/pedidos', '/api/v1/stock/reporte'],
  repositorio: 'https://github.com/G2w1n/apis',
}));

const v1 = express.Router();
v1.get('/health', salud);
v1.use('/auth', authRoutes);
v1.use('/categorias', categoriasRoutes);
v1.use('/productos', productosRoutes);
v1.use('/pedidos', pedidosRoutes);
v1.use('/stock', stockRoutes);
app.use('/api/v1', v1);

app.use(rutaNoEncontrada);
app.use(manejarErrores);
