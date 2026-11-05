// src/app.js
import express          from 'express'
import cors             from 'cors'
import { env }          from './config/env.js'
import authRoutes       from './routes/authRoutes.js'
import ubicacionRoutes from './routes/ubicacionRoutes.js'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import busRoutes       from './routes/busRoutes.js'
import rutaRoutes      from './routes/rutaRoutes.js'
import paradaRoutes    from './routes/paradaRoutes.js'
import horarioRoutes   from './routes/horarioRoutes.js'
import notificacionRoutes from './routes/notificacionRoutes.js'
import usuarioRoutes from './routes/usuarioRoutes.js'


const app = express()

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

  // En desarrollo permitimos LAN para pruebas desde celular sin editar CLIENT_URL cada vez.
  if (process.env.NODE_ENV !== 'production' && esOrigenLan(normalizedOrigin)) {
    return true
  }

  if (process.env.NODE_ENV !== 'production' && esOrigenNgrok(normalizedOrigin)) {
    return true
  }

  return false
}

// Necesario cuando el backend corre detras de ngrok/proxy (X-Forwarded-For).
app.set('trust proxy', 1)

// servir archivos estaticamente
const __dirname = dirname(fileURLToPath(import.meta.url))
app.use(express.static(join(__dirname, '../public')))

// ── Middlewares globales ─────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Permite herramientas sin Origin (Postman/curl), origins configurados y LAN en dev.
    if (origenPermitido(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin no permitido por CORS: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json())

// ── Ruta de salud ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'ok',
    message: 'Servidor de monitoreo de buses UPC funcionando',
    time:    new Date().toISOString(),
  })
})

// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/ubicacion', ubicacionRoutes)
app.use('/api/buses',     busRoutes)
app.use('/api/rutas',     rutaRoutes)
app.use('/api/paradas',   paradaRoutes)
app.use('/api/horarios',  horarioRoutes)
app.use('/api/notificaciones', notificacionRoutes)
app.use('/api/usuarios', usuarioRoutes)

// ── Ruta no encontrada ───────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

export default app