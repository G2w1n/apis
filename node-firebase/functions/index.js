// Punto de entrada para Firebase Cloud Functions (2.ª generación)
import { onRequest } from 'firebase-functions/v2/https';
import { app } from './src/app.js';

// Misma región que Firestore (São Paulo) para evitar latencia entre continentes
export const api = onRequest({ region: 'southamerica-east1', memory: '256MiB', maxInstances: 10 }, app);
