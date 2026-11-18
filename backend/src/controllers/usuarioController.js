// src/controllers/usuarioController.js
import { Usuario } from '../models/Usuario.js'
import * as usuarioService from '../services/usuarioService.js'
import { asyncHandler } from '../middlewares/errorMiddleware.js'

const USUARIO_NO_ENCONTRADO = [404, 'Usuario no encontrado']
const USUARIO_YA_REGISTRADO = [400, 'Ese nombre de usuario ya está en uso']

// GET /api/usuarios
export const listarUsuarios = asyncHandler(async (_req, res) => {
  const usuarios = await Usuario.todos()
  return res.status(200).json({ usuarios })
})

// POST /api/usuarios
export const crearUsuario = asyncHandler(async (req, res) => {
  const { nombre, nombre_usuario, correo, password } = req.body

  if (!nombre || !nombre_usuario || !correo || !password) {
    return res.status(400).json({ error: 'nombre, nombre_usuario, correo y password son obligatorios' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
  }

  const id_usuario = await usuarioService.crear(req.body)
  return res.status(201).json({ ok: true, id_usuario })
}, {
  USUARIO_YA_REGISTRADO,
  CORREO_YA_REGISTRADO: [400, 'Ya existe un usuario con ese correo'],
})

// PATCH /api/usuarios/:id
export const editarUsuario = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { nombre, nombre_usuario, correo, tipo_usuario, password } = req.body

  // El PATCH reemplaza todos los campos: sin ellos el UPDATE violaría NOT NULL (antes respondía 500)
  if (!nombre || !nombre_usuario || !correo || !tipo_usuario) {
    return res.status(400).json({ error: 'nombre, nombre_usuario, correo y tipo_usuario son obligatorios' })
  }

  if (password && password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
  }

  await usuarioService.editar(id, req.body)
  return res.status(200).json({ ok: true })
}, {
  USUARIO_NO_ENCONTRADO,
  USUARIO_YA_REGISTRADO,
  CORREO_YA_REGISTRADO: [400, 'Ese correo ya está en uso'],
})

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 3 a 20 caracteres: letras, números, punto, guion y guion bajo (las mismas reglas que el registro)
const REGEX_NOMBRE_USUARIO = /^[a-zA-Z0-9._-]{3,20}$/

// PATCH /api/usuarios/perfil  — el propio usuario edita sus datos (nombre, correo y, opcionalmente, su nombre de usuario).
// Devuelve un token nuevo: el JWT lleva nombre y nombre_usuario, y la sesión abierta no debe quedarse con los viejos.
export const editarPerfil = asyncHandler(async (req, res) => {
  const id = req.usuario.id_usuario
  const { nombre, correo } = req.body
  const cambiaUsuario = req.body.nombre_usuario !== undefined
  const nombre_usuario = cambiaUsuario ? String(req.body.nombre_usuario).trim().toLowerCase() : undefined

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }
  if (correo && !REGEX_CORREO.test(correo)) {
    return res.status(400).json({ error: 'El correo no tiene un formato válido' })
  }
  if (cambiaUsuario && !REGEX_NOMBRE_USUARIO.test(nombre_usuario)) {
    return res.status(400).json({ error: 'El nombre de usuario debe tener de 3 a 20 caracteres: letras, números, punto, guion o guion bajo' })
  }

  const { usuario, token } = await usuarioService.editarPerfil(id, {
    nombre: nombre.trim(), correo, nombre_usuario,
  })
  return res.status(200).json({ ok: true, usuario, token })
}, {
  USUARIO_YA_REGISTRADO: [409, 'Ese nombre de usuario ya está en uso'],
  CORREO_YA_REGISTRADO: [400, 'Ese correo ya está en uso'],
})

// PATCH /api/usuarios/password  — el propio usuario cambia su contraseña
export const cambiarPassword = asyncHandler(async (req, res) => {
  const id = req.usuario.id_usuario
  const { password_actual, password_nueva } = req.body

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: 'Ambas contraseñas son obligatorias' })
  }
  if (password_nueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres' })
  }

  await usuarioService.cambiarPassword(id, password_actual, password_nueva)
  return res.status(200).json({ ok: true })
}, {
  PASSWORD_ACTUAL_INCORRECTA: [401, 'La contraseña actual es incorrecta'],
  USUARIO_NO_ENCONTRADO,
})

// DELETE /api/usuarios/:id
export const eliminarUsuario = asyncHandler(async (req, res) => {
  const { id } = req.params
  await usuarioService.eliminar(id)
  return res.status(200).json({ ok: true })
}, { USUARIO_NO_ENCONTRADO })
