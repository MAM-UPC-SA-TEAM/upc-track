// src/middlewares/rateLimitMiddleware.js
// Bloquea el acceso tras múltiples intentos fallidos (RNF11)

import rateLimit from 'express-rate-limit'

export const loginRateLimit = rateLimit({
  windowMs:         15 * 60 * 1000, // ventana de 15 minutos
  max:              5,               // máximo 5 intentos por ventana
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    error: 'Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.'
  },
  // Solo cuenta como intento fallido si la respuesta es 4xx
  skipSuccessfulRequests: true,
})

// Registro público: cuenta TODOS los intentos (no solo los fallidos), porque cada alta crea una cuenta
// y, cuando exista la verificación por correo, cada intento puede enviar un mensaje (vector de abuso).
export function crearRegistroRateLimit(max = 10) {
  return rateLimit({
    windowMs:        60 * 60 * 1000, // ventana de 1 hora
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Demasiados intentos de registro. Intenta de nuevo más tarde.' },
    skip: () => process.env.NODE_ENV === 'test' && !process.env.PROBAR_RATE_LIMIT,
  })
}

export const registroRateLimit = crearRegistroRateLimit()
