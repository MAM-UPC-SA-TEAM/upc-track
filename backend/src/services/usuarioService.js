// src/services/usuarioService.js
// Reglas de negocio de la gestión de usuarios (B02). El controlador valida HTTP y traduce los errores.
// Errores de dominio (código en `message`):
//   USUARIO_YA_REGISTRADO · CORREO_YA_REGISTRADO · USUARIO_NO_ENCONTRADO · PASSWORD_ACTUAL_INCORRECTA

import bcrypt from 'bcryptjs'
import { Usuario } from '../models/Usuario.js'
import { esDuplicado } from '../config/database.js'
import { generarToken } from '../utils/jwt.js'

const COSTO_HASH = 10

// Traduce la violación UNIQUE a un error de dominio según la columna que chocó
function traducirDuplicado(error) {
  if (!esDuplicado(error)) return error
  const codigo = error.constraint?.includes('nombre_usuario') ? 'USUARIO_YA_REGISTRADO' : 'CORREO_YA_REGISTRADO'
  return new Error(codigo, { cause: error })
}

const activoComoNumero = (activo) => (activo === false ? 0 : 1)

/** Alta por el admin. Devuelve id_usuario. */
export async function crear({ nombre, nombre_usuario, correo, password, tipo_usuario, activo }) {
  try {
    return await Usuario.crear({
      nombre,
      nombre_usuario: nombre_usuario.toLowerCase(),
      correo,
      password_hash: await bcrypt.hash(password, COSTO_HASH),
      tipo_usuario: tipo_usuario || 'estudiante',
      activo: activoComoNumero(activo),
    })
  } catch (error) {
    throw traducirDuplicado(error)
  }
}

/** El admin reemplaza los datos; con `password` también cambia la clave. */
export async function editar(id, { nombre, nombre_usuario, correo, tipo_usuario, activo, password }) {
  try {
    const cambiados = await Usuario.actualizar(id, {
      nombre,
      nombre_usuario: nombre_usuario?.toLowerCase(),
      correo,
      tipo_usuario,
      activo: activoComoNumero(activo),
      password_hash: password ? await bcrypt.hash(password, COSTO_HASH) : undefined,
    })
    if (cambiados === 0) throw new Error('USUARIO_NO_ENCONTRADO')
  } catch (error) {
    throw traducirDuplicado(error)
  }
}

/**
 * El propio usuario edita sus datos. Devuelve `{ usuario, token }`: el JWT lleva nombre y nombre_usuario,
 * y la sesión abierta no debe quedarse con los viejos.
 */
export async function editarPerfil(id, { nombre, correo, nombre_usuario }) {
  let usuario
  try {
    usuario = await Usuario.actualizarPerfil(id, { nombre, correo, nombre_usuario })
  } catch (error) {
    throw traducirDuplicado(error)
  }
  if (!usuario) throw new Error('USUARIO_NO_ENCONTRADO')

  const token = generarToken({
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    nombre_usuario: usuario.nombre_usuario,
    correo: usuario.correo,
    tipo_usuario: usuario.tipo_usuario,
  })
  return { usuario, token }
}

export async function cambiarPassword(id, passwordActual, passwordNueva) {
  const hash = await Usuario.hashDe(id)
  if (!hash) throw new Error('USUARIO_NO_ENCONTRADO')
  if (!(await bcrypt.compare(passwordActual, hash))) throw new Error('PASSWORD_ACTUAL_INCORRECTA')
  await Usuario.cambiarHash(id, await bcrypt.hash(passwordNueva, COSTO_HASH))
}

export async function eliminar(id) {
  if (await Usuario.eliminar(id) === 0) throw new Error('USUARIO_NO_ENCONTRADO')
}
