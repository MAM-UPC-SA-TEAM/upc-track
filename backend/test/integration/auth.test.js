// Pruebas HTTP de /api/auth (rutas + middlewares + controller + service) con pool.query mockeado.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import bcrypt from 'bcryptjs'

const { default: app } = await import('../../src/app.js')
const { pool } = await import('../../src/config/database.js')
const { generarToken } = await import('../../src/utils/jwt.js')

let query
beforeEach(() => { query = mock.method(pool, 'query') })
afterEach(() => mock.restoreAll())

const tokenDe = (tipo_usuario, id_usuario = 1) => generarToken({ id_usuario, tipo_usuario, nombre: 'Test' })
const falloDup = (constraint) => Object.assign(new Error('dup'), { code: '23505', constraint })

// ── Registro ────────────────────────────────────────────────
test('POST /registro: faltan campos → 400', async () => {
  const res = await request(app).post('/api/auth/registro').send({ nombre: 'Ana' })
  assert.equal(res.status, 400)
})

test('POST /registro: contraseña corta → 400', async () => {
  const res = await request(app).post('/api/auth/registro')
    .send({ nombre: 'Ana', nombre_usuario: 'ana', correo: 'a@u.co', password: '123' })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /8 caracteres/)
})

test('POST /registro: crea estudiante, normaliza datos y devuelve 201 con token', async () => {
  query.mock.mockImplementation(async () => ({ rows: [{ id_usuario: 10 }] }))
  const res = await request(app).post('/api/auth/registro')
    .send({ nombre: '  Ana  ', nombre_usuario: ' ANA ', correo: ' ANA@U.CO ', password: 'clave1234' })
  assert.equal(res.status, 201)
  assert.ok(res.body.token)
  assert.equal(res.body.usuario.tipo_usuario, 'estudiante')
  const [, params] = query.mock.calls[0].arguments
  assert.deepEqual([params[0], params[1], params[2]], ['Ana', 'ana', 'ana@u.co'])
})

test('POST /registro: correo duplicado → 400', async () => {
  query.mock.mockImplementation(async () => { throw falloDup('usuario_correo_key') })
  const res = await request(app).post('/api/auth/registro')
    .send({ nombre: 'A', nombre_usuario: 'a', correo: 'a@u.co', password: 'clave1234' })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /correo/)
})

test('POST /registro: nombre de usuario duplicado → 400', async () => {
  query.mock.mockImplementation(async () => { throw falloDup('usuario_nombre_usuario_key') })
  const res = await request(app).post('/api/auth/registro')
    .send({ nombre: 'A', nombre_usuario: 'a', correo: 'a@u.co', password: 'clave1234' })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /nombre de usuario/)
})

test('POST /registro: error inesperado → 500', async () => {
  mock.method(console, 'error', () => {})
  query.mock.mockImplementation(async () => { throw new Error('BD caída') })
  const res = await request(app).post('/api/auth/registro')
    .send({ nombre: 'A', nombre_usuario: 'a', correo: 'a@u.co', password: 'clave1234' })
  assert.equal(res.status, 500)
})

// ── /me y /logout ───────────────────────────────────────────
test('GET /me sin token → 401', async () => {
  const res = await request(app).get('/api/auth/me')
  assert.equal(res.status, 401)
})

test('GET /me con token → datos del usuario', async () => {
  const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${tokenDe('estudiante', 4)}`)
  assert.equal(res.status, 200)
  assert.equal(res.body.usuario.id_usuario, 4)
})

test('POST /logout sin token → 401', async () => {
  const res = await request(app).post('/api/auth/logout')
  assert.equal(res.status, 401)
})

test('POST /logout de estudiante → 200 sin tocar buses', async () => {
  const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${tokenDe('estudiante')}`)
  assert.equal(res.status, 200)
  assert.equal(query.mock.callCount(), 0)
})

test('POST /logout de conductor deja su bus inactivo', async () => {
  query.mock.mockImplementation(async () => ({ rows: [] }))
  const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${tokenDe('conductor', 8)}`)
  assert.equal(res.status, 200)
  const [sql, params] = query.mock.calls[0].arguments
  assert.match(sql, /UPDATE bus SET estado = 'inactivo'/)
  assert.deepEqual(params, [8])
})

test('POST /logout responde 200 aunque falle la BD', async () => {
  mock.method(console, 'error', () => {})
  query.mock.mockImplementation(async () => { throw new Error('BD caída') })
  const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${tokenDe('conductor')}`)
  assert.equal(res.status, 200)
})

// ── Login (al final: el rate limit cuenta los intentos fallidos por IP) ──
test('POST /login: éxito → 200 con token y sin hash', async () => {
  const password_hash = await bcrypt.hash('clave1234', 4)
  query.mock.mockImplementation(async () => ({ rows: [{
    id_usuario: 5, nombre: 'Ana', nombre_usuario: 'ana', correo: 'a@u.co', tipo_usuario: 'estudiante', password_hash,
  }] }))
  const res = await request(app).post('/api/auth/login').send({ nombre_usuario: 'ana', password: 'clave1234' })
  assert.equal(res.status, 200)
  assert.ok(res.body.token)
  assert.equal(JSON.stringify(res.body).includes('password_hash'), false)
})

test('POST /login: sin campos → 400', async () => {
  const res = await request(app).post('/api/auth/login').send({})
  assert.equal(res.status, 400)
})

test('POST /login: contraseña corta → 400', async () => {
  const res = await request(app).post('/api/auth/login').send({ nombre_usuario: 'ana', password: '123' })
  assert.equal(res.status, 400)
})

test('POST /login: credenciales incorrectas → 401', async () => {
  query.mock.mockImplementation(async () => ({ rows: [] }))
  const res = await request(app).post('/api/auth/login').send({ nombre_usuario: 'x', password: 'clave1234' })
  assert.equal(res.status, 401)
})

test('POST /login: error inesperado → 500', async () => {
  mock.method(console, 'error', () => {})
  query.mock.mockImplementation(async () => { throw new Error('BD caída') })
  const res = await request(app).post('/api/auth/login').send({ nombre_usuario: 'x', password: 'clave1234' })
  assert.equal(res.status, 500)
})

test('POST /login: tras 5 intentos fallidos el rate limit responde 429', async () => {
  query.mock.mockImplementation(async () => ({ rows: [] }))
  let ultimo
  for (let i = 0; i < 6; i++) {
    ultimo = await request(app).post('/api/auth/login').send({ nombre_usuario: 'x', password: 'clave1234' })
  }
  assert.equal(ultimo.status, 429)
})
