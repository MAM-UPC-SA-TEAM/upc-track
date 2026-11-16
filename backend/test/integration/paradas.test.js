// Pruebas HTTP de /api/paradas con el modelo Parada mockeado.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { default: app } = await import('../../src/app.js')
const { Parada } = await import('../../src/models/Parada.js')
const { generarToken } = await import('../../src/utils/jwt.js')

beforeEach(() => mock.method(console, 'error', () => {}))
afterEach(() => mock.restoreAll())

const auth = (tipo) => ({ Authorization: `Bearer ${generarToken({ id_usuario: 1, tipo_usuario: tipo, nombre: 'U' })}` })
const admin = () => auth('admin')
const estudiante = () => auth('estudiante')
const fallo = () => { throw new Error('BD caída') }

const valida = { nombre: 'Terminal', lat: '10.47', lng: '-73.6', ruta_id: '2', orden: '1' }

// ── Listar ──────────────────────────────────────────────────
test('GET /paradas sin token → 401', async () => {
  assert.equal((await request(app).get('/api/paradas')).status, 401)
})

test('GET /paradas sin filtro devuelve todas', async () => {
  const todas = mock.method(Parada, 'todas', async () => [{ id_parada: 1 }])
  const res = await request(app).get('/api/paradas').set(estudiante())
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { paradas: [{ id_parada: 1 }] })
  assert.equal(todas.mock.callCount(), 1)
})

test('GET /paradas?ruta_id=3 filtra por ruta', async () => {
  const porRuta = mock.method(Parada, 'porRuta', async () => [{ id_parada: 9 }])
  const res = await request(app).get('/api/paradas?ruta_id=3').set(estudiante())
  assert.equal(res.status, 200)
  assert.equal(porRuta.mock.calls[0].arguments[0], '3')
})

test('GET /paradas → 500 si falla el modelo', async () => {
  mock.method(Parada, 'todas', async () => fallo())
  assert.equal((await request(app).get('/api/paradas').set(estudiante())).status, 500)
})

// ── Crear ───────────────────────────────────────────────────
test('POST /paradas: no admin → 403', async () => {
  assert.equal((await request(app).post('/api/paradas').set(estudiante()).send(valida)).status, 403)
})

test('POST /paradas: faltan campos → 400', async () => {
  assert.equal((await request(app).post('/api/paradas').set(admin()).send({ nombre: 'X' })).status, 400)
})

test('POST /paradas: orden 0 es válido (no se confunde con vacío)', async () => {
  mock.method(Parada, 'crear', async () => 5)
  const res = await request(app).post('/api/paradas').set(admin()).send({ ...valida, orden: 0 })
  assert.equal(res.status, 201)
})

test('POST /paradas: lat/lng/orden no numéricos → 400', async () => {
  const res = await request(app).post('/api/paradas').set(admin()).send({ ...valida, lat: 'abc' })
  assert.equal(res.status, 400)
})

test('POST /paradas: convierte a número y devuelve el id', async () => {
  const crear = mock.method(Parada, 'crear', async () => 42)
  const res = await request(app).post('/api/paradas').set(admin()).send(valida)
  assert.equal(res.status, 201)
  assert.equal(res.body.id_parada, 42)
  assert.deepEqual(crear.mock.calls[0].arguments[0],
    { nombre: 'Terminal', lat: 10.47, lng: -73.6, activa: true, idRuta: 2, orden: 1 })
})

test('POST /paradas → 500 si falla el modelo', async () => {
  mock.method(Parada, 'crear', async () => fallo())
  assert.equal((await request(app).post('/api/paradas').set(admin()).send(valida)).status, 500)
})

// ── Editar ──────────────────────────────────────────────────
test('PATCH /paradas/:id: no admin → 403', async () => {
  assert.equal((await request(app).patch('/api/paradas/1').set(estudiante()).send(valida)).status, 403)
})

test('PATCH /paradas/:id: faltan campos → 400', async () => {
  assert.equal((await request(app).patch('/api/paradas/1').set(admin()).send({})).status, 400)
})

test('PATCH /paradas/:id: valores no numéricos → 400', async () => {
  assert.equal((await request(app).patch('/api/paradas/1').set(admin()).send({ ...valida, orden: 'x' })).status, 400)
})

test('PATCH /paradas/:id: inexistente → 404 y no edita', async () => {
  mock.method(Parada, 'porId', async () => null)
  const editar = mock.method(Parada, 'editar', async () => {})
  assert.equal((await request(app).patch('/api/paradas/99').set(admin()).send(valida)).status, 404)
  assert.equal(editar.mock.callCount(), 0)
})

test('PATCH /paradas/:id: edita con los datos convertidos', async () => {
  mock.method(Parada, 'porId', async () => ({ id_parada: 7 }))
  const editar = mock.method(Parada, 'editar', async () => {})
  const res = await request(app).patch('/api/paradas/7').set(admin()).send({ ...valida, activa: false })
  assert.equal(res.status, 200)
  assert.equal(editar.mock.calls[0].arguments[0], 7)
  assert.equal(editar.mock.calls[0].arguments[1].activa, false)
})

test('PATCH /paradas/:id → 500 si falla el modelo', async () => {
  mock.method(Parada, 'porId', async () => fallo())
  assert.equal((await request(app).patch('/api/paradas/7').set(admin()).send(valida)).status, 500)
})

// ── Eliminar ────────────────────────────────────────────────
test('DELETE /paradas/:id: no admin → 403', async () => {
  assert.equal((await request(app).delete('/api/paradas/1').set(estudiante())).status, 403)
})

test('DELETE /paradas/:id: inexistente → 404', async () => {
  mock.method(Parada, 'porId', async () => null)
  assert.equal((await request(app).delete('/api/paradas/99').set(admin())).status, 404)
})

test('DELETE /paradas/:id: existente → 200', async () => {
  mock.method(Parada, 'porId', async () => ({ id_parada: 7 }))
  const eliminar = mock.method(Parada, 'eliminar', async () => {})
  const res = await request(app).delete('/api/paradas/7').set(admin())
  assert.equal(res.status, 200)
  assert.equal(eliminar.mock.calls[0].arguments[0], 7)
})

test('DELETE /paradas/:id → 500 si falla el modelo', async () => {
  mock.method(Parada, 'porId', async () => fallo())
  assert.equal((await request(app).delete('/api/paradas/7').set(admin())).status, 500)
})
