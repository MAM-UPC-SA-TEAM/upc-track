// src/config/conexion.js
// Opciones de conexion a PostgreSQL a partir de variables de entorno.
// Lo usan el pool de la API y los scripts de scripts/db, para que ambos se
// conecten exactamente igual.
//
// Dos formas de configurar (la primera tiene prioridad):
//   DATABASE_URL=postgresql://usuario:clave@host/base?sslmode=require   (Neon)
//   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME                     (local)
//
// TLS: se activa si la URL pide sslmode=require/verify-* o si DB_SSL=true.
// Siempre se verifica el certificado del servidor (Neon usa una CA publica).

export function usaDatabaseUrl(vars = process.env) {
  return Boolean(vars.DATABASE_URL)
}

export function usaTLS(vars = process.env) {
  if (vars.DB_SSL === 'true') return true
  if (vars.DB_SSL === 'false') return false
  return /[?&]sslmode=(require|verify-ca|verify-full)\b/.test(vars.DATABASE_URL || '')
}

export function opcionesPool(vars = process.env) {
  const base = usaDatabaseUrl(vars)
    ? { connectionString: vars.DATABASE_URL }
    : {
        host:     vars.DB_HOST,
        port:     Number(vars.DB_PORT),
        user:     vars.DB_USER,
        password: vars.DB_PASSWORD,
        database: vars.DB_NAME,
      }
  return {
    ...base,
    ...(usaTLS(vars) ? { ssl: { rejectUnauthorized: true } } : {}),
  }
}
