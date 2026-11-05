// src/utils/jwt.js
// Genera y verifica tokens JWT

import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function generarToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  })
}

export function verificarToken(token) {
  return jwt.verify(token, env.jwt.secret)
}
