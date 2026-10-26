// Configuración central. En Cloud Functions las variables vienen de functions/.env
export const config = {
  puerto: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'cambia-este-secreto-en-produccion',
  jwtExpiracion: process.env.JWT_EXPIRACION || '8h',
  // Límite general de peticiones por IP y por minuto (se puede subir para benchmarks)
  limitePorMinuto: Number(process.env.RATE_LIMIT_POR_MINUTO) || 600,
  // Orígenes extra permitidos por CORS, separados por comas
  corsExtra: (process.env.CORS_ORIGENES || '').split(',').map((o) => o.trim()).filter(Boolean),
  // Con emulador se usa "demo-tienda" (el prefijo "demo-" no necesita credenciales).
  // En la nube el SDK toma el proyecto de Cloud Functions o de la cuenta de servicio.
  proyectoId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID
    || (process.env.FIRESTORE_EMULATOR_HOST ? 'demo-tienda' : undefined),
};
