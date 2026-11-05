// src/controllers/authController.js
// Recibe la petición HTTP, valida los datos
// y llama al servicio correspondiente

import { login, registrarEstudiante } from '../services/authService.js'
import { pool } from '../config/database.js'

// POST /api/auth/login
export async function loginController(req, res) {
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

  try {
    const resultado = await login(nombre_usuario, password)
    return res.status(200).json(resultado)
  } catch (error) {
    if (error.message === 'CREDENCIALES_INVALIDAS') {
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos'
      })
    }
    console.error('Error en login:', error)
    return res.status(500).json({
      error: 'Error interno del servidor'
    })
  }
}

// POST /api/auth/registro
export async function registroController(req, res) {
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

  try {
    const resultado = await registrarEstudiante({
      nombre:         String(nombre).trim(),
      nombre_usuario: String(nombre_usuario).trim().toLowerCase(),
      correo:         String(correo).trim().toLowerCase(),
      password,
    })
    return res.status(201).json(resultado)
  } catch (error) {
    if (error.message === 'CORREO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Ya existe una cuenta con ese correo' })
    }
    if (error.message === 'USUARIO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' })
    }
    console.error('Error en registro:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/auth/logout
export async function logoutController(req, res) {
  try {
    if (req.usuario?.tipo_usuario === 'conductor') {
      await pool.query(
        `UPDATE bus SET estado = 'inactivo' WHERE id_conductor = ? AND estado != 'inactivo'`,
        [req.usuario.id_usuario]
      )
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
