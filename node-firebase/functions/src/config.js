// Configuración central. En Cloud Functions las variables vienen de functions/.env
export const config = {
  puerto: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'cambia-este-secreto-en-produccion',
  jwtExpiracion: process.env.JWT_EXPIRACION || '8h',
  // Prefijo "demo-" = proyecto ficticio que el emulador acepta sin credenciales
  proyectoId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'demo-tienda',
};
