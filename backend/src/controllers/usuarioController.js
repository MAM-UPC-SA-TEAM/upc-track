// src/controllers/usuarioController.js
import { Usuario } from '../models/Usuario.js'
import bcrypt from 'bcryptjs'
import { pool } from '../config/database.js'

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
  const { nombre, nombre_usuario, correo, password, tipo_usuario, activo } = req.body

  if (!nombre || !nombre_usuario || !correo || !password) {
    return res.status(400).json({ error: 'nombre, nombre_usuario, correo y password son obligatorios' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
  }

  try {
    const password_hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      `INSERT INTO usuario (nombre, nombre_usuario, correo, password_hash, tipo_usuario, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, nombre_usuario.toLowerCase(), correo, password_hash, tipo_usuario || 'estudiante', activo === false ? 0 : 1]
    )
    return res.status(201).json({ ok: true, id_usuario: result.insertId })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('nombre_usuario')) {
        return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' })
      }
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo' })
    }
    console.error('Error creando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// PATCH /api/usuarios/:id
export async function editarUsuario(req, res) {
  const { id } = req.params
  const { nombre, nombre_usuario, correo, tipo_usuario, activo, password } = req.body

  try {
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' })
      }
      const password_hash = await bcrypt.hash(password, 10)
      await pool.query(
        `UPDATE usuario SET nombre=?, nombre_usuario=?, correo=?, tipo_usuario=?, activo=?, password_hash=?
         WHERE id_usuario=?`,
        [nombre, nombre_usuario?.toLowerCase(), correo, tipo_usuario, activo === false ? 0 : 1, password_hash, id]
      )
    } else {
      await pool.query(
        `UPDATE usuario SET nombre=?, nombre_usuario=?, correo=?, tipo_usuario=?, activo=?
         WHERE id_usuario=?`,
        [nombre, nombre_usuario?.toLowerCase(), correo, tipo_usuario, activo === false ? 0 : 1, id]
      )
    }
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ese nombre de usuario ya está en uso' })
    }
    console.error('Error editando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// PATCH /api/usuarios/perfil  — el propio usuario edita sus datos
export async function editarPerfil(req, res) {
  const id = req.usuario.id_usuario
  const { nombre, correo } = req.body

  if (!nombre?.trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' })
  }
  if (correo && !REGEX_CORREO.test(correo)) {
    return res.status(400).json({ error: 'El correo no tiene un formato válido' })
  }

  try {
    await pool.query(
      `UPDATE usuario SET nombre=?, correo=? WHERE id_usuario=?`,
      [nombre.trim(), correo, id]
    )
    const [[usuario]] = await pool.query(
      `SELECT id_usuario, nombre, nombre_usuario, correo, tipo_usuario FROM usuario WHERE id_usuario=?`,
      [id]
    )
    return res.status(200).json({ ok: true, usuario })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
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
    const [[usuario]] = await pool.query(
      `SELECT password_hash FROM usuario WHERE id_usuario=?`, [id]
    )
    const coincide = await bcrypt.compare(password_actual, usuario.password_hash)
    if (!coincide) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' })
    }

    const nuevoHash = await bcrypt.hash(password_nueva, 10)
    await pool.query(
      `UPDATE usuario SET password_hash=? WHERE id_usuario=?`, [nuevoHash, id]
    )
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error cambiando contraseña:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// DELETE /api/usuarios/:id
export async function eliminarUsuario(req, res) {
  const { id } = req.params
  try {
    await pool.query(`DELETE FROM usuario WHERE id_usuario=?`, [id])
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}