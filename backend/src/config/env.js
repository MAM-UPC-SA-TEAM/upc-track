// src/config/env.js
// Carga y valida las variables de entorno requeridas
 
import dotenv from 'dotenv'
dotenv.config()
 
const required = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_URL'
]
 
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Variable de entorno faltante: ${key}`)
    process.exit(1)
  }
}
 
export const env = {
  port:          process.env.PORT,
  db: {
    host:        process.env.DB_HOST,
    port:        Number(process.env.DB_PORT),
    user:        process.env.DB_USER,
    password:    process.env.DB_PASSWORD,
    name:        process.env.DB_NAME,
  },
  jwt: {
    secret:      process.env.JWT_SECRET,
    expiresIn:   process.env.JWT_EXPIRES_IN,
  },
  clientUrl:     process.env.CLIENT_URL,
  allowedOrigins: process.env.CLIENT_URL
    .split(',')
    .map(origin => origin.trim())
    .map(origin => origin.replace(/\/+$/, ''))
    .filter(Boolean),
}