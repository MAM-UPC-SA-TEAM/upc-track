// scripts/db/migrate.mjs
// Aplica el esquema (y opcionalmente un seed) sobre la base indicada por el .env.
// Es idempotente: schema.sql usa IF NOT EXISTS, asi que se puede repetir sin perder datos.
//
//   npm run db:migrate                       -> solo el esquema
//   npm run db:migrate -- --seed seed.sql     -> esquema + datos de DESARROLLO (clave conocida)
//   npm run db:migrate -- --seed seed.prod.sql -> esquema + datos reales, sin usuarios
//
// Apunta a donde diga DATABASE_URL (Neon) o las variables DB_* (local).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import dotenv from 'dotenv'
import pg from 'pg'
import { opcionesPool, usaDatabaseUrl } from '../../src/config/conexion.js'

dotenv.config()

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database')
const args = process.argv.slice(2)
const seed = args.includes('--seed') ? args[args.indexOf('--seed') + 1] : null

if (seed === 'seed.sql' && usaDatabaseUrl() && !args.includes('--forzar-seed-dev')) {
  console.error('✗ seed.sql crea usuarios con la clave publica Admin123*. No se aplica sobre DATABASE_URL.')
  console.error('  Usa seed.prod.sql, o --forzar-seed-dev si de verdad es una base desechable.')
  process.exit(1)
}

const cliente = new pg.Client(opcionesPool())
const destino = usaDatabaseUrl() ? new URL(process.env.DATABASE_URL).host : `${process.env.DB_HOST}:${process.env.DB_PORT}`

try {
  await cliente.connect()
  console.log(`Conectado a ${destino}`)
  for (const archivo of ['schema.sql', ...(seed ? [seed] : [])]) {
    await cliente.query(readFileSync(path.join(raiz, archivo), 'utf8'))
    console.log(`✔ ${archivo}`)
  }
  const { rows } = await cliente.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  )
  console.log(`Tablas: ${rows.map((r) => r.table_name).join(', ')}`)
} catch (error) {
  console.error('✗', error.message)
  process.exitCode = 1
} finally {
  await cliente.end()
}
