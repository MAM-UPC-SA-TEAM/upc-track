// src/server.js
// Punto de entrada — inicia HTTP y Socket.io

import { createServer } from 'http'
import { Server }       from 'socket.io'
import app              from './app.js'
import { env }          from './config/env.js'
import { connectDB }    from './config/database.js'
import { busSocket }    from './sockets/busSocket.js'

function esOrigenLan(origin) {
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

function esOrigenNgrok(origin) {
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

function origenPermitido(origin) {
  if (!origin) return true
  const normalizedOrigin = origin.replace(/\/+$/, '')
  if (env.allowedOrigins.includes('*') || env.allowedOrigins.includes(normalizedOrigin)) {
    return true
  }
  if (process.env.NODE_ENV !== 'production' && esOrigenLan(normalizedOrigin)) {
    return true
  }
  if (process.env.NODE_ENV !== 'production' && esOrigenNgrok(normalizedOrigin)) {
    return true
  }
  return false
}

// ── Crear servidor HTTP sobre Express ────────────────────────
const httpServer = createServer(app)

// ── Configurar Socket.io ─────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (origenPermitido(origin)) return callback(null, true)
      return callback(new Error(`Origin no permitido por Socket CORS: ${origin}`))
    },
    credentials: true,
  }
})

app.set('io', io)

// Registrar eventos de Socket.io
busSocket(io)

// ── Iniciar servidor ─────────────────────────────────────────
async function start() {
  await connectDB()

  httpServer.listen(env.port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`)
    console.log(`🏥 Health check: http://localhost:${env.port}/api/health`)
  })
}

start()