// Pruebas HTTP de /api/usuarios: administración (solo admin) y perfil/contraseña propios.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import bcrypt from 'bcryptjs'

const { default: app } = await import('../../src/app.js')
const { pool } = await import('../../src/config/database.js')
const { Usuario } = await import('../../src/models/Usuario.js')
const { generarToken } = await import('../../src/utils/jwt.js')

let query
beforeEach(() => {
  query = mock.method(pool, 'query', async () => ({ rows: [{ id_usuario: 1 }] }))
  mock.method(console, 'error', () => {})
})
afterEach(() => mock.restoreAll())

const auth = (tipo, id = 1) => ({ Authorization: `Bearer ${generarToken({ id_usuario: id, tipo_usuario: tipo, nombre: 'U' })}` })
const admin = () => auth('admin')
const estudiante = (id = 4) => auth('estudiante', id)
const fallo = () => { throw new Error('BD caída') }
const duplicado = (constraint) => () => { throw Object.assign(new Error('dup'), { code: '23505', constraint }) }

const nuevo = { nombre: 'Ana', nombre_usuario: 'ANA', correo: 'a@u.co', password: 'clave1234' }

// ── Permisos ────────────────────────────────────────────────
test('rutas de administración: sin token → 401 y no admin → 403', async () => {
  assert.equal((await request(app).get('/api/usuarios')).status, 401)
  assert.equal((await request(app).get('/api/usuarios').set(estudiante())).status, 403)
  assert.equal((await request(app).post('/api/usuarios').set(estudiante()).send(nuevo)).status, 403)
  assert.equal((await request(app).patch('/api/usuarios/1').set(estudiante()).send({})).status, 403)
  assert.equal((await request(app).delete('/api/usuarios/1').set(estudiante())).status, 403)
})

// ── Listar ──────────────────────────────────────────────────
test('GET /usuarios → 200 con la lista', async () => {
  mock.method(Usuario, 'todos', async () => [{ id_usuario: 1 }])
  const res = await request(app).get('/api/usuarios').set(admin())
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { usuarios: [{ id_usuario: 1 }] })
})

test('GET /usuarios → 500 si falla el modelo', async () => {
  mock.method(Usuario, 'todos', async () => fallo())
  assert.equal((await request(app).get('/api/usuarios').set(admin())).status, 500)
})

// ── Crear ───────────────────────────────────────────────────
test('POST /usuarios: faltan campos → 400', async () => {
  assert.equal((await request(app).post('/api/usuarios').set(admin()).send({ nombre: 'A' })).status, 400)
})

test('POST /usuarios: contraseña corta → 400', async () => {
  assert.equal((await request(app).post('/api/usuarios').set(admin()).send({ ...nuevo, password: '123' })).status, 400)
})

test('POST /usuarios: crea con hash, usuario en minúsculas y rol por defecto', async () => {
  const res = await request(app).post('/api/usuarios').set(admin()).send(nuevo)
  assert.equal(res.status, 201)
  assert.equal(res.body.id_usuario, 1)
  const p = query.mock.calls[0].arguments[1]
  assert.equal(p[1], 'ana')
  assert.notEqual(p[3], 'clave1234')
  assert.ok(await bcrypt.compare('clave1234', p[3]))
  assert.deepEqual([p[4], p[5]], ['estudiante', 1])
})

test('POST /usuarios: respeta rol y activo=false', async () => {
  await request(app).post('/api/usuarios').set(admin()).send({ ...nuevo, tipo_usuario: 'conductor', activo: false })
  const p = query.mock.calls[0].arguments[1]
  assert.deepEqual([p[4], p[5]], ['conductor', 0])
})

test('POST /usuarios: nombre de usuario duplicado → 400', async () => {
  query.mock.mockImplementation(duplicado('usuario_nombre_usuario_key'))
  const res = await request(app).post('/api/usuarios').set(admin()).send(nuevo)
  assert.equal(res.status, 400)
  assert.match(res.body.error, /nombre de usuario/)
})

test('POST /usuarios: correo duplicado → 400', async () => {
  query.mock.mockImplementation(duplicado('usuario_correo_key'))
  const res = await request(app).post('/api/usuarios').set(admin()).send(nuevo)
  assert.equal(res.status, 400)
  assert.match(res.body.error, /correo/)
})

test('POST /usuarios: error inesperado → 500', async () => {
  query.mock.mockImplementation(fallo)
  assert.equal((await request(app).post('/api/usuarios').set(admin()).send(nuevo)).status, 500)
})

// ── Editar (admin) ──────────────────────────────────────────
const edicion = { nombre: 'N', nombre_usuario: 'NU', correo: 'n@u.co', tipo_usuario: 'conductor', activo: true }

test('PATCH /usuarios/:id sin password no toca el hash', async () => {
  const res = await request(app).patch('/api/usuarios/7').set(admin()).send(edicion)
  assert.equal(res.status, 200)
  assert.doesNotMatch(query.mock.calls[0].arguments[0], /password_hash/)
  assert.deepEqual(query.mock.calls[0].arguments[1], ['N', 'nu', 'n@u.co', 'conductor', 1, '7'])
})

test('PATCH /usuarios/:id con password actualiza el hash', async () => {
  const res = await request(app).patch('/api/usuarios/7').set(admin()).send({ ...edicion, activo: false, password: 'otraclave1' })
  assert.equal(res.status, 200)
  const p = query.mock.calls[0].arguments[1]
  assert.equal(p[4], 0)
  assert.ok(await bcrypt.compare('otraclave1', p[5]))
})

test('PATCH /usuarios/:id: password corta → 400 sin consultar la BD', async () => {
  const res = await request(app).patch('/api/usuarios/7').set(admin()).send({ ...edicion, password: '123' })
  assert.equal(res.status, 400)
  assert.equal(query.mock.callCount(), 0)
})

test('PATCH /usuarios/:id: duplicado → 400', async () => {
  query.mock.mockImplementation(duplicado('usuario_nombre_usuario_key'))
  assert.equal((await request(app).patch('/api/usuarios/7').set(admin()).send(edicion)).status, 400)
})

test('PATCH /usuarios/:id: error inesperado → 500', async () => {
  query.mock.mockImplementation(fallo)
  assert.equal((await request(app).patch('/api/usuarios/7').set(admin()).send(edicion)).status, 500)
})

// ── Eliminar ────────────────────────────────────────────────
test('DELETE /usuarios/:id: admin → 200', async () => {
  const res = await request(app).delete('/api/usuarios/7').set(admin())
  assert.equal(res.status, 200)
  assert.deepEqual(query.mock.calls[0].arguments[1], ['7'])
})

test('DELETE /usuarios/:id → 500 si falla la BD', async () => {
  query.mock.mockImplementation(fallo)
  assert.equal((await request(app).delete('/api/usuarios/7').set(admin())).status, 500)
})

// ── Perfil propio ───────────────────────────────────────────
test('PATCH /perfil sin token → 401', async () => {
  assert.equal((await request(app).patch('/api/usuarios/perfil').send({ nombre: 'A' })).status, 401)
})

test('PATCH /perfil: nombre vacío → 400', async () => {
  assert.equal((await request(app).patch('/api/usuarios/perfil').set(estudiante()).send({ nombre: '  ' })).status, 400)
})

test('PATCH /perfil: correo con formato inválido → 400', async () => {
  const res = await request(app).patch('/api/usuarios/perfil').set(estudiante()).send({ nombre: 'Ana', correo: 'no-es-correo' })
  assert.equal(res.status, 400)
})

test('PATCH /perfil: actualiza solo al propio usuario y devuelve sus datos', async () => {
  query.mock.mockImplementation(async (sql) =>
    sql.startsWith('SELECT') ? { rows: [{ id_usuario: 4, nombre: 'Ana' }] } : { rows: [] })
  const res = await request(app).patch('/api/usuarios/perfil').set(estudiante(4)).send({ nombre: '  Ana  ', correo: 'a@u.co' })
  assert.equal(res.status, 200)
  assert.equal(res.body.usuario.nombre, 'Ana')
  assert.deepEqual(query.mock.calls[0].arguments[1], ['Ana', 'a@u.co', 4])
})

test('PATCH /perfil: correo duplicado → 400', async () => {
  query.mock.mockImplementation(duplicado('usuario_correo_key'))
  const res = await request(app).patch('/api/usuarios/perfil').set(estudiante()).send({ nombre: 'Ana', correo: 'a@u.co' })
  assert.equal(res.status, 400)
})

test('PATCH /perfil: error inesperado → 500', async () => {
  query.mock.mockImplementation(fallo)
  assert.equal((await request(app).patch('/api/usuarios/perfil').set(estudiante()).send({ nombre: 'Ana' })).status, 500)
})

// ── Cambiar contraseña ──────────────────────────────────────
test('PATCH /password: faltan datos → 400', async () => {
  assert.equal((await request(app).patch('/api/usuarios/password').set(estudiante()).send({ password_actual: 'x' })).status, 400)
})

test('PATCH /password: nueva contraseña corta → 400', async () => {
  const res = await request(app).patch('/api/usuarios/password').set(estudiante()).send({ password_actual: 'x', password_nueva: '123' })
  assert.equal(res.status, 400)
})

test('PATCH /password: la actual es incorrecta → 401 y no actualiza', async () => {
  const password_hash = await bcrypt.hash('verdadera1', 4)
  query.mock.mockImplementation(async () => ({ rows: [{ password_hash }] }))
  const res = await request(app).patch('/api/usuarios/password').set(estudiante())
    .send({ password_actual: 'equivocada', password_nueva: 'nueva12345' })
  assert.equal(res.status, 401)
  assert.equal(query.mock.callCount(), 1)
})

test('PATCH /password: cambia la contraseña guardando un hash nuevo', async () => {
  const password_hash = await bcrypt.hash('verdadera1', 4)
  query.mock.mockImplementation(async () => ({ rows: [{ password_hash }] }))
  const res = await request(app).patch('/api/usuarios/password').set(estudiante(4))
    .send({ password_actual: 'verdadera1', password_nueva: 'nueva12345' })
  assert.equal(res.status, 200)
  const [, params] = query.mock.calls[1].arguments
  assert.ok(await bcrypt.compare('nueva12345', params[0]))
  assert.equal(params[1], 4)
})

test('PATCH /password: error inesperado → 500', async () => {
  query.mock.mockImplementation(fallo)
  const res = await request(app).patch('/api/usuarios/password').set(estudiante())
    .send({ password_actual: 'x', password_nueva: 'nueva12345' })
  assert.equal(res.status, 500)
})
