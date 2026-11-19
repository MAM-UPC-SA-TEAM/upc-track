// src/controllers/authController.js
// Recibe la petición HTTP, valida los datos
// y llama al servicio correspondiente

import { login, registrarEstudiante } from '../services/authService.js'
import { liberarDeConductor } from '../services/busService.js'
import { asyncHandler } from '../middlewares/errorMiddleware.js'
import { esCorreoPermitido, mensajeCorreoNoPermitido, normalizarCorreo } from '../utils/correo.js'

// POST /api/auth/login
export const loginController = asyncHandler(async (req, res) => {
  const { nombre_usuario, password } = req.body

  if (!nombre_usuario || !password) {
    return res.status(400).json({
      error: 'El nombre de usuario y la contraseña son obligatorios'
    })
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'La contraseña debe tener mínimo 8 caracteres'
    })
  }

  const resultado = await login(nombre_usuario, password)
  return res.status(200).json(resultado)
}, {
  CREDENCIALES_INVALIDAS: [401, 'Usuario o contraseña incorrectos'],
  CUENTA_INACTIVA: [403, 'Tu cuenta aún no está activa. Un administrador debe aprobarla.', { codigo: 'CUENTA_INACTIVA' }],
})

// POST /api/auth/registro
export const registroController = asyncHandler(async (req, res) => {
  const { nombre, nombre_usuario, correo, password } = req.body

  if (!nombre || !nombre_usuario || !correo || !password) {
    return res.status(400).json({
      error: 'nombre, nombre de usuario, correo y contraseña son obligatorios'
    })
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      error: 'La contraseña debe tener mínimo 8 caracteres'
    })
  }

  // El dominio se valida aquí, en el servidor: saltarse el formulario no sirve
  if (!esCorreoPermitido(correo)) {
    return res.status(400).json({ error: mensajeCorreoNoPermitido() })
  }

  const resultado = await registrarEstudiante({
    nombre:         String(nombre).trim(),
    nombre_usuario: String(nombre_usuario).trim().toLowerCase(),
    correo:         normalizarCorreo(correo),
    password,
  })
  return res.status(201).json({
    ...resultado,
    mensaje: 'Cuenta creada. Un administrador debe aprobarla antes de que puedas iniciar sesión.',
  })
}, {
  CORREO_YA_REGISTRADO: [400, 'Ya existe una cuenta con ese correo'],
  USUARIO_YA_REGISTRADO: [400, 'Ese nombre de usuario ya está en uso'],
})

// POST /api/auth/logout
export async function logoutController(req, res) {
  try {
    if (req.usuario?.tipo_usuario === 'conductor') {
      await liberarDeConductor(req.usuario.id_usuario)
    }
  } catch (err) {
    console.error('Error reseteando bus en logout:', err)
  }
  return res.status(200).json({ message: 'Sesión cerrada correctamente' })
}

// GET /api/auth/me
// Retorna los datos del usuario autenticado actual
export function meController(req, res) {
  return res.status(200).json({ usuario: req.usuario })
}
