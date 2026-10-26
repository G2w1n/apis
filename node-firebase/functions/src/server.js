// Servidor standalone (desarrollo local y benchmarks). En Firebase se usa ../index.js
import { app } from './app.js';
import { config } from './config.js';
import { exigirCredenciales, proyectoActivo } from './firebase.js';

exigirCredenciales();

app.listen(config.puerto, () => {
  const destino = process.env.FIRESTORE_EMULATOR_HOST ? `emulador ${process.env.FIRESTORE_EMULATOR_HOST}` : `proyecto ${proyectoActivo}`;
  console.log(`API Express + Firestore en http://localhost:${config.puerto}/api/v1 (${destino})`);
});
