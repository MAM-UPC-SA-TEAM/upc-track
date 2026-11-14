// authService con pool.query mockeado: no toca la base de datos.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'

const { pool } = await import('../../src/config/database.js')
const { login, registrarEstudiante } = await import('../../src/services/authService.js')
const { verificarToken } = await import('../../src/utils/jwt.js')

let query
beforeEach(() => { query = mock.method(pool, 'query') })
afterEach(() => mock.restoreAll())

const usuarioBD = async (password = 'clave123') => ({
  id_usuario: 5, nombre: 'Ana', nombre_usuario: 'ana', correo: 'ana@unicesar.edu.co',
  tipo_usuario: 'estudiante', password_hash: await bcrypt.hash(password, 4),
})

test('login: credenciales correctas devuelve token y usuario sin hash', async () => {
  query.mock.mockImplementation(async () => ({ rows: [await usuarioBD()] }))
  const r = await login('ana', 'clave123')
  assert.equal(r.usuario.nombre_usuario, 'ana')
  assert.equal('password_hash' in r.usuario, false)
  assert.equal(verificarToken(r.token).id_usuario, 5)
})

test('login: usuario inexistente lanza CREDENCIALES_INVALIDAS', async () => {
  query.mock.mockImplementation(async () => ({ rows: [] }))
  await assert.rejects(login('nadie', 'x'), { message: 'CREDENCIALES_INVALIDAS' })
})

test('login: contraseña incorrecta lanza CREDENCIALES_INVALIDAS', async () => {
  query.mock.mockImplementation(async () => ({ rows: [await usuarioBD()] }))
  await assert.rejects(login('ana', 'mala'), { message: 'CREDENCIALES_INVALIDAS' })
})

test('registrarEstudiante: guarda hash (no la clave) y devuelve token', async () => {
  query.mock.mockImplementation(async () => ({ rows: [{ id_usuario: 9 }] }))
  const r = await registrarEstudiante({ nombre: 'Luis', nombre_usuario: 'luis', correo: 'l@u.co', password: 'secreta1' })
  const params = query.mock.calls[0].arguments[1]
  assert.notEqual(params[3], 'secreta1')
  assert.ok(await bcrypt.compare('secreta1', params[3]))
  assert.equal(r.usuario.tipo_usuario, 'estudiante')
  assert.equal(verificarToken(r.token).id_usuario, 9)
})

test('registrarEstudiante: nombre_usuario duplicado → USUARIO_YA_REGISTRADO', async () => {
  query.mock.mockImplementation(async () => { throw Object.assign(new Error('dup'), { code: '23505', constraint: 'usuario_nombre_usuario_key' }) })
  await assert.rejects(registrarEstudiante({ nombre: 'a', nombre_usuario: 'a', correo: 'a@a', password: 'x' }), { message: 'USUARIO_YA_REGISTRADO' })
})

test('registrarEstudiante: correo duplicado → CORREO_YA_REGISTRADO', async () => {
  query.mock.mockImplementation(async () => { throw Object.assign(new Error('dup'), { code: '23505', constraint: 'usuario_correo_key' }) })
  await assert.rejects(registrarEstudiante({ nombre: 'a', nombre_usuario: 'a', correo: 'a@a', password: 'x' }), { message: 'CORREO_YA_REGISTRADO' })
})

test('registrarEstudiante: otros errores se propagan', async () => {
  query.mock.mockImplementation(async () => { throw new Error('caída de BD') })
  await assert.rejects(registrarEstudiante({ nombre: 'a', nombre_usuario: 'a', correo: 'a@a', password: 'x' }), { message: 'caída de BD' })
})
