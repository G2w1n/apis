// Punto de entrada para Firebase Cloud Functions (2.ª generación)
import { onRequest } from 'firebase-functions/v2/https';
import { app } from './src/app.js';

export const api = onRequest({ region: 'us-central1', memory: '256MiB', maxInstances: 10 }, app);
