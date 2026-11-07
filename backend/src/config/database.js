// src/config/database.js
// Pool de conexiones a PostgreSQL (Neon en produccion, contenedor local en desarrollo).
// Usar pool en lugar de una sola conexion permite
// manejar multiples peticiones simultaneas (RNF1)

import pg from 'pg'
import './env.js'   // carga y valida el .env antes de crear el pool
import { opcionesPool } from './conexion.js'

// COUNT() y otros agregados llegan como BIGINT y pg los devuelve como texto;
// los convertimos a numero (nuestros conteos son pequenos). DECIMAL/NUMERIC se
// queda como texto, igual que con mysql2.
pg.types.setTypeParser(pg.types.builtins.INT8, (valor) => Number(valor))

export const pool = new pg.Pool({
  ...opcionesPool(),
  max: 10,                         // maximo 10 conexiones simultaneas
  connectionTimeoutMillis: 15000,  // Neon puede tardar unos segundos en despertar tras suspenderse
})

// Un error en una conexion inactiva del pool no debe tumbar el proceso
pool.on('error', (error) => {
  console.error('Error en una conexion inactiva de PostgreSQL:', error.message)
})

// Violacion de restriccion UNIQUE (equivale al ER_DUP_ENTRY de MySQL)
export const esDuplicado = (error) => error?.code === '23505'

// Ejecuta fn(client) dentro de una transaccion; hace ROLLBACK si falla
export async function transaccion(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const resultado = await fn(client)
    await client.query('COMMIT')
    return resultado
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// Verificar conexion al iniciar
export async function connectDB() {
  try {
    await pool.query('SELECT 1')
    console.log('✅ Conexión a PostgreSQL exitosa')
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error.message)
    process.exit(1)
  }
}
