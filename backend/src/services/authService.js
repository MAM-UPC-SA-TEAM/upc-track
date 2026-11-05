// src/services/authService.js
// Lógica de negocio de autenticación
// Usa el modelo Usuario del diagrama de clases

import bcrypt           from 'bcryptjs'
import { Usuario }      from '../models/Usuario.js'
import { generarToken } from '../utils/jwt.js'
import { pool }         from '../config/database.js'

export async function login(nombre_usuario, password) {
  const usuario = await Usuario.porNombreUsuario(nombre_usuario)

  if (!usuario) {
    throw new Error('CREDENCIALES_INVALIDAS')
  }

  // 3. Verificar contraseña con bcrypt (RNF7)
  const passwordValida = await bcrypt.compare(password, usuario.password_hash)
  if (!passwordValida) {
    throw new Error('CREDENCIALES_INVALIDAS')
  }

  // 4. Generar JWT con datos del usuario
  const token = generarToken({
    id_usuario:     usuario.id_usuario,
    nombre:         usuario.nombre,
    nombre_usuario: usuario.nombre_usuario,
    correo:         usuario.correo,
    tipo_usuario:   usuario.tipo_usuario,
  })

  return {
    token,
    usuario: {
      id_usuario:     usuario.id_usuario,
      nombre:         usuario.nombre,
      nombre_usuario: usuario.nombre_usuario,
      correo:         usuario.correo,
      tipo_usuario:   usuario.tipo_usuario,
    },
  }
}

export async function registrarEstudiante({ nombre, nombre_usuario, correo, password }) {
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const [result] = await pool.query(
      `INSERT INTO usuario (nombre, nombre_usuario, correo, password_hash, tipo_usuario, activo)
       VALUES (?, ?, ?, ?, 'estudiante', 1)`,
      [nombre, nombre_usuario, correo, passwordHash]
    )

    const usuario = {
      id_usuario:     result.insertId,
      nombre,
      nombre_usuario,
      correo,
      tipo_usuario: 'estudiante',
    }

    const token = generarToken(usuario)

    return { token, usuario }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('nombre_usuario')) {
        throw new Error('USUARIO_YA_REGISTRADO')
      }
      throw new Error('CORREO_YA_REGISTRADO')
    }
    throw error
  }
}
