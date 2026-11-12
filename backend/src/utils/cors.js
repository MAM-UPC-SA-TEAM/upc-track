// src/utils/cors.js
// Política de orígenes permitidos, compartida por Express (app.js) y Socket.IO (server.js).

import { env } from '../config/env.js'

// Orígenes con los que la WebView de Capacitor sirve la app empaquetada:
// Android usa https://localhost (androidScheme: 'https') e iOS usa capacitor://localhost.
// Se permiten en todos los entornos; el APK siempre llama a un backend ya desplegado.
const ORIGENES_NATIVOS = ['https://localhost', 'capacitor://localhost']

export function esOrigenLan(origin) {
  try {
    const { hostname } = new URL(origin)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    )
  } catch {
    return false
  }
}

export function esOrigenNgrok(origin) {
  try {
    const { hostname } = new URL(origin)
    return (
      hostname.endsWith('.ngrok-free.dev') ||
      hostname.endsWith('.ngrok.app') ||
      hostname.endsWith('.ngrok.io')
    )
  } catch {
    return false
  }
}

export function origenPermitido(origin) {
  // Sin cabecera Origin: herramientas como Postman/curl y peticiones del mismo origen.
  if (!origin) return true
  const normalizedOrigin = origin.replace(/\/+$/, '')

  if (env.allowedOrigins.includes('*') || env.allowedOrigins.includes(normalizedOrigin)) {
    return true
  }

  if (ORIGENES_NATIVOS.includes(normalizedOrigin)) {
    return true
  }

  // En desarrollo se permite LAN y ngrok para probar desde el celular sin editar CLIENT_URL.
  if (process.env.NODE_ENV !== 'production' && esOrigenLan(normalizedOrigin)) {
    return true
  }

  if (process.env.NODE_ENV !== 'production' && esOrigenNgrok(normalizedOrigin)) {
    return true
  }

  return false
}

function crearOpciones(etiqueta) {
  return {
    origin: (origin, callback) => {
      if (origenPermitido(origin)) return callback(null, true)
      return callback(new Error(`Origin no permitido por ${etiqueta}: ${origin}`))
    },
    credentials: true,
  }
}

/** Opciones para el middleware `cors()` de Express. */
export const corsOptions = crearOpciones('CORS')

/** Opciones para `new Server(httpServer, { cors })` de Socket.IO. */
export const socketCorsOptions = crearOpciones('Socket CORS')
