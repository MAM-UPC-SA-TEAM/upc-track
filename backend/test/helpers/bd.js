// Base de datos REAL de prueba para test/db/. Importar ESTE archivo antes que cualquier módulo de src/.
// Usa el Postgres desechable de docker-compose.e2e.yml (npm run e2e:db:up, puerto 5434) o el servicio del CI.
// Salvaguarda: aplica seed.sql (claves públicas), así que se niega a tocar una base que no sea local.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'

const BD = {
  DB_HOST: process.env.TEST_DB_HOST || '127.0.0.1',
  DB_PORT: process.env.TEST_DB_PORT || '5434',
  DB_USER: process.env.TEST_DB_USER || 'postgres',
  DB_PASSWORD: process.env.TEST_DB_PASSWORD || 'postgres',
  DB_NAME: process.env.TEST_DB_NAME || 'bd_e2e',
}

if (!['127.0.0.1', 'localhost'].includes(BD.DB_HOST)) {
  throw new Error(`test/db: la base de pruebas debe ser local, no «${BD.DB_HOST}».`)
}

Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: '3000',
  ...BD,
  JWT_SECRET: 'secreto-de-pruebas',
  JWT_EXPIRES_IN: '1h',
  CLIENT_URL: 'http://localhost:5173',
})
process.env.DATABASE_URL = '' // vacío (no borrado): dotenv no pisa una variable ya definida, así jamás se apunta a Neon

const carpetaSql = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database')

/** Aplica esquema + seed de desarrollo (idempotente). Falla con un mensaje claro si la BD no está levantada. */
export async function prepararBD() {
  const cliente = new pg.Client({
    host: BD.DB_HOST, port: Number(BD.DB_PORT), user: BD.DB_USER, password: BD.DB_PASSWORD, database: BD.DB_NAME,
  })
  try {
    await cliente.connect()
  } catch {
    throw new Error('test/db: no hay Postgres de pruebas. Ejecuta «npm run e2e:db:up» en la raíz.')
  }
  try {
    for (const archivo of ['schema.sql', 'seed.sql']) {
      await cliente.query(readFileSync(path.join(carpetaSql, archivo), 'utf8'))
    }
  } finally {
    await cliente.end()
  }
}

let n = 0
/** Sufijo único por corrida y por llamada: las pruebas no chocan entre sí ni con corridas anteriores. */
export const unico = () => `${Date.now().toString(36)}${(n++).toString(36)}`
