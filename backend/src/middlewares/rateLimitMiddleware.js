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
