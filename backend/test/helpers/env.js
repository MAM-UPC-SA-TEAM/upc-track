// Variables de entorno de prueba. Importar ESTE archivo antes que cualquier módulo de src/:
// config/env.js lee y valida process.env al cargarse.
Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: '3000',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  JWT_SECRET: 'secreto-de-pruebas',
  JWT_EXPIRES_IN: '1h',
  CLIENT_URL: 'http://localhost:5173',
})
