// src/controllers/usuarioController.js
import { Usuario } from '../models/Usuario.js'
import * as usuarioService from '../services/usuarioService.js'

// GET /api/usuarios
export async function listarUsuarios(_req, res) {
  try {
    const usuarios = await Usuario.todos()
    return res.status(200).json({ usuarios })
  } catch (error) {
    console.error('Error listando usuarios:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// POST /api/usuarios
export async function crearUsuario(req, res) {
  const { nombre, nombre_usuario, correo, password } = req.body

  if (!nombre || !nombre_usuario || !correo || !password) {
    return res.status(400).json({ error: 'nombre, nombre_usuario, correo y password son obligatorios' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
  }

  try {
    const id_usuario = await usuarioService.crear(req.body)
    return res.status(201).json({ ok: true, id_usuario })
  } catch (error) {
    if (error.message === 'USUARIO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' })
    }
    if (error.message === 'CORREO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo' })
    }
    console.error('Error creando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/usuarios/:id
export async function editarUsuario(req, res) {
  const { id } = req.params
  const { nombre, nombre_usuario, correo, tipo_usuario, password } = req.body

  // El PATCH reemplaza todos los campos: sin ellos el UPDATE violaría NOT NULL (antes respondía 500)
  if (!nombre || !nombre_usuario || !correo || !tipo_usuario) {
    return res.status(400).json({ error: 'nombre, nombre_usuario, correo y tipo_usuario son obligatorios' })
  }

  if (password && password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
  }

  try {
    await usuarioService.editar(id, req.body)
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (error.message === 'USUARIO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' })
    }
    if (error.message === 'CORREO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Ese correo ya está en uso' })
    }
    console.error('Error editando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 3 a 20 caracteres: letras, números, punto, guion y guion bajo (las mismas reglas que el registro)
const REGEX_NOMBRE_USUARIO = /^[a-zA-Z0-9._-]{3,20}$/

// PATCH /api/usuarios/perfil  — el propio usuario edita sus datos (nombre, correo y, opcionalmente, su nombre de usuario).
// Devuelve un token nuevo: el JWT lleva nombre y nombre_usuario, y la sesión abierta no debe quedarse con los viejos.
export async function editarPerfil(req, res) {
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

  try {
    const { usuario, token } = await usuarioService.editarPerfil(id, {
      nombre: nombre.trim(), correo, nombre_usuario,
    })
    return res.status(200).json({ ok: true, usuario, token })
  } catch (error) {
    if (error.message === 'USUARIO_YA_REGISTRADO') {
      return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' })
    }
    if (error.message === 'CORREO_YA_REGISTRADO') {
      return res.status(400).json({ error: 'Ese correo ya está en uso' })
    }
    console.error('Error editando perfil:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/usuarios/password  — el propio usuario cambia su contraseña
export async function cambiarPassword(req, res) {
  const id = req.usuario.id_usuario
  const { password_actual, password_nueva } = req.body

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: 'Ambas contraseñas son obligatorias' })
  }
  if (password_nueva.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres' })
  }

  try {
    await usuarioService.cambiarPassword(id, password_actual, password_nueva)
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (error.message === 'PASSWORD_ACTUAL_INCORRECTA') {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }
    if (error.message === 'USUARIO_NO_ENCONTRADO') {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    console.error('Error cambiando contraseña:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/usuarios/:id
export async function eliminarUsuario(req, res) {
  const { id } = req.params
  try {
    await usuarioService.eliminar(id)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
