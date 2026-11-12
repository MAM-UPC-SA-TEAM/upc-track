// src/middlewares/authMiddleware.js
// Verifica el JWT en cada petición protegida
// y valida el rol del usuario (RNF — seguridad)

import { verificarToken } from '../utils/jwt.js'

// ── Verifica que el token JWT sea válido ─────────────────────
export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verificarToken(token)
    req.usuario = payload  // disponible en el controller
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// ── Verifica que el usuario tenga el rol requerido ───────────
// Uso: roleMiddleware('admin') o roleMiddleware('conductor', 'admin')
export function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario?.tipo_usuario)) {
      return res.status(403).json({
        error: 'No tienes permiso para realizar esta acción'
      })
    }
    next()
  }
}
