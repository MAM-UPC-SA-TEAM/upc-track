// Pruebas HTTP de /api/rutas con el modelo Ruta y pool.query mockeados.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { default: app } = await import('../../src/app.js')
const { pool } = await import('../../src/config/database.js')
const { Ruta } = await import('../../src/models/Ruta.js')
const { generarToken } = await import('../../src/utils/jwt.js')

let query
beforeEach(() => {
  query = mock.method(pool, 'query', async () => ({ rows: [{ id_ruta: 1 }] }))
  mock.method(console, 'error', () => {})
})
afterEach(() => mock.restoreAll())

const auth = (tipo) => ({ Authorization: `Bearer ${generarToken({ id_usuario: 1, tipo_usuario: tipo, nombre: 'U' })}` })
const admin = () => auth('admin')
const estudiante = () => auth('estudiante')
const fallo = () => { throw new Error('BD caída') }

// ── Lecturas ────────────────────────────────────────────────
test('GET /rutas sin token → 401', async () => {
  assert.equal((await request(app).get('/api/rutas')).status, 401)
})

test('GET /rutas → 200 con la lista', async () => {
  mock.method(Ruta, 'todas', async () => [{ id_ruta: 1 }])
  const res = await request(app).get('/api/rutas').set(estudiante())
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { rutas: [{ id_ruta: 1 }] })
})

test('GET /rutas → 500 si falla el modelo', async () => {
  mock.method(Ruta, 'todas', async () => fallo())
  assert.equal((await request(app).get('/api/rutas').set(estudiante())).status, 500)
})

test('GET /rutas/:id existente → 200', async () => {
  const porId = mock.method(Ruta, 'porId', async () => ({ id_ruta: 3 }))
  const res = await request(app).get('/api/rutas/3').set(estudiante())
  assert.equal(res.status, 200)
  assert.equal(res.body.ruta.id_ruta, 3)
  assert.equal(porId.mock.calls[0].arguments[0], '3')
})

test('GET /rutas/:id inexistente → 404', async () => {
  mock.method(Ruta, 'porId', async () => null)
  assert.equal((await request(app).get('/api/rutas/99').set(estudiante())).status, 404)
})

test('GET /rutas/:id → 500 si falla el modelo', async () => {
  mock.method(Ruta, 'porId', async () => fallo())
  assert.equal((await request(app).get('/api/rutas/3').set(estudiante())).status, 500)
})

// ── Crear ───────────────────────────────────────────────────
test('POST /rutas: no admin → 403', async () => {
  assert.equal((await request(app).post('/api/rutas').set(estudiante()).send({ nombre: 'R' })).status, 403)
})

test('POST /rutas: sin nombre → 400', async () => {
  assert.equal((await request(app).post('/api/rutas').set(admin()).send({})).status, 400)
})

test('POST /rutas: crea con descripción vacía y activa por defecto', async () => {
  const res = await request(app).post('/api/rutas').set(admin()).send({ nombre: 'Ruta A' })
  assert.equal(res.status, 201)
  assert.equal(res.body.id_ruta, 1)
  assert.deepEqual(query.mock.calls[0].arguments[1], ['Ruta A', '', 1])
})

test('POST /rutas: respeta activa=false', async () => {
  await request(app).post('/api/rutas').set(admin()).send({ nombre: 'R', descripcion: 'd', activa: false })
  assert.deepEqual(query.mock.calls[0].arguments[1], ['R', 'd', 0])
})

test('POST /rutas → 500 si falla la BD', async () => {
  query.mock.mockImplementation(async () => fallo())
  assert.equal((await request(app).post('/api/rutas').set(admin()).send({ nombre: 'R' })).status, 500)
})

// ── Editar ──────────────────────────────────────────────────
test('PATCH /rutas/:id: no admin → 403', async () => {
  assert.equal((await request(app).patch('/api/rutas/1').set(estudiante()).send({})).status, 403)
})

test('PATCH /rutas/:id: actualiza la ruta indicada', async () => {
  const res = await request(app).patch('/api/rutas/4').set(admin()).send({ nombre: 'Nueva', descripcion: 'x', activa: false })
  assert.equal(res.status, 200)
  assert.deepEqual(query.mock.calls[0].arguments[1], ['Nueva', 'x', 0, '4'])
})

test('PATCH /rutas/:id → 500 si falla la BD', async () => {
  query.mock.mockImplementation(async () => fallo())
  assert.equal((await request(app).patch('/api/rutas/4').set(admin()).send({ nombre: 'N' })).status, 500)
})

// ── Eliminar ────────────────────────────────────────────────
test('DELETE /rutas/:id: no admin → 403', async () => {
  assert.equal((await request(app).delete('/api/rutas/1').set(estudiante())).status, 403)
})

test('DELETE /rutas/:id: admin → 200', async () => {
  const res = await request(app).delete('/api/rutas/4').set(admin())
  assert.equal(res.status, 200)
  assert.deepEqual(query.mock.calls[0].arguments[1], ['4'])
})

test('DELETE /rutas/:id → 500 si falla la BD', async () => {
  query.mock.mockImplementation(async () => fallo())
  assert.equal((await request(app).delete('/api/rutas/4').set(admin())).status, 500)
})
