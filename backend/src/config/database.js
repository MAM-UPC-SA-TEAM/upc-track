// src/config/database.js
// Pool de conexiones a MySQL
// Usar pool en lugar de una sola conexión permite
// manejar múltiples peticiones simultáneas (RNF1)

import mysql from 'mysql2/promise'
import { env } from './env.js'

export const pool = mysql.createPool({
  host:               env.db.host,
  port:               env.db.port,
  user:               env.db.user,
  password:           env.db.password,
  database:           env.db.name,
  waitForConnections: true,
  connectionLimit:    10,   // máximo 10 conexiones simultáneas
  queueLimit:         0,
})

// Verificar conexión al iniciar
export async function connectDB() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Conexión a MySQL exitosa')
    connection.release()
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message)
    process.exit(1)
  }
}