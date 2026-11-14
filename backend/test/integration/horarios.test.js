// Pruebas HTTP de /api/horarios con el modelo Horario mockeado.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { default: app } = await import('../../src/app.js')
const { Horario } = await import('../../src/models/Horario.js')
const { generarToken } = await import('../../src/utils/jwt.js')

beforeEach(() => mock.method(console, 'error', () => {}))
afterEach(() => mock.restoreAll())

const auth = (tipo) => ({ Authorization: `Bearer ${generarToken({ id_usuario: 1, tipo_usuario: tipo, nombre: 'U' })}` })
const admin = () => auth('admin')
const estudiante = () => auth('estudiante')
const fallo = () => { throw new Error('BD caída') }

const valido = { ruta_id: '2', hora_salida: '06:30', hora_llegada: '07:15' }

// ── Listar ──────────────────────────────────────────────────
test('GET /horarios sin token → 401', async () => {
  assert.equal((await request(app).get('/api/horarios')).status, 401)
})

test('GET /horarios sin filtro devuelve todos', async () => {
  mock.method(Horario, 'todos', async () => [{ id_horario: 1 }])
  const res = await request(app).get('/api/horarios').set(estudiante())
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { horarios: [{ id_horario: 1 }] })
})

test('GET /horarios?ruta_id=3 filtra por ruta (numérica)', async () => {
  const porRuta = mock.method(Horario, 'porRuta', async () => [])
  const res = await request(app).get('/api/horarios?ruta_id=3').set(estudiante())
  assert.equal(res.status, 200)
  assert.equal(porRuta.mock.calls[0].arguments[0], 3)
})

test('GET /horarios → 500 si falla el modelo', async () => {
  mock.method(Horario, 'todos', async () => fallo())
  assert.equal((await request(app).get('/api/horarios').set(estudiante())).status, 500)
})

// ── Crear ───────────────────────────────────────────────────
test('POST /horarios: no admin → 403', async () => {
  assert.equal((await request(app).post('/api/horarios').set(estudiante()).send(valido)).status, 403)
})

test('POST /horarios: faltan campos → 400', async () => {
  assert.equal((await request(app).post('/api/horarios').set(admin()).send({ ruta_id: 1 })).status, 400)
})

for (const mala of ['6:30', '24:00', '12:60', 'abc', '06:30:00']) {
  test(`POST /horarios: hora inválida «${mala}» → 400`, async () => {
    const res = await request(app).post('/api/horarios').set(admin()).send({ ...valido, hora_llegada: mala })
    assert.equal(res.status, 400)
    assert.match(res.body.error, /HH:mm/)
  })
}

test('POST /horarios: acepta los extremos 00:00 y 23:59', async () => {
  mock.method(Horario, 'crear', async () => 8)
  const res = await request(app).post('/api/horarios').set(admin())
    .send({ ruta_id: 1, hora_salida: '00:00', hora_llegada: '23:59' })
  assert.equal(res.status, 201)
})

test('POST /horarios: crea y devuelve el id con la ruta numérica', async () => {
  const crear = mock.method(Horario, 'crear', async () => 42)
  const res = await request(app).post('/api/horarios').set(admin()).send(valido)
  assert.equal(res.status, 201)
  assert.equal(res.body.id_horario, 42)
  assert.deepEqual(crear.mock.calls[0].arguments[0], { id_ruta: 2, hora_salida: '06:30', hora_llegada: '07:15' })
})

test('POST /horarios → 500 si falla el modelo', async () => {
  mock.method(Horario, 'crear', async () => fallo())
  assert.equal((await request(app).post('/api/horarios').set(admin()).send(valido)).status, 500)
})

// ── Editar ──────────────────────────────────────────────────
test('PATCH /horarios/:id: no admin → 403', async () => {
  assert.equal((await request(app).patch('/api/horarios/1').set(estudiante()).send(valido)).status, 403)
})

test('PATCH /horarios/:id: faltan campos → 400', async () => {
  assert.equal((await request(app).patch('/api/horarios/1').set(admin()).send({ hora_salida: '06:00' })).status, 400)
})

test('PATCH /horarios/:id: hora inválida → 400', async () => {
  assert.equal((await request(app).patch('/api/horarios/1').set(admin()).send({ hora_salida: '99:99', hora_llegada: '07:00' })).status, 400)
})

test('PATCH /horarios/:id: inexistente → 404 y no edita', async () => {
  mock.method(Horario, 'porId', async () => null)
  const editar = mock.method(Horario, 'editar', async () => {})
  assert.equal((await request(app).patch('/api/horarios/99').set(admin()).send(valido)).status, 404)
  assert.equal(editar.mock.callCount(), 0)
})

test('PATCH /horarios/:id: edita las horas', async () => {
  mock.method(Horario, 'porId', async () => ({ id_horario: 7 }))
  const editar = mock.method(Horario, 'editar', async () => {})
  const res = await request(app).patch('/api/horarios/7').set(admin()).send(valido)
  assert.equal(res.status, 200)
  assert.deepEqual(editar.mock.calls[0].arguments, [7, { hora_salida: '06:30', hora_llegada: '07:15' }])
})

test('PATCH /horarios/:id → 500 si falla el modelo', async () => {
  mock.method(Horario, 'porId', async () => fallo())
  assert.equal((await request(app).patch('/api/horarios/7').set(admin()).send(valido)).status, 500)
})

// ── Eliminar ────────────────────────────────────────────────
test('DELETE /horarios/:id: no admin → 403', async () => {
  assert.equal((await request(app).delete('/api/horarios/1').set(estudiante())).status, 403)
})

test('DELETE /horarios/:id: inexistente → 404', async () => {
  mock.method(Horario, 'porId', async () => null)
  assert.equal((await request(app).delete('/api/horarios/99').set(admin())).status, 404)
})

test('DELETE /horarios/:id: existente → 200', async () => {
  mock.method(Horario, 'porId', async () => ({ id_horario: 7 }))
  const eliminar = mock.method(Horario, 'eliminar', async () => {})
  const res = await request(app).delete('/api/horarios/7').set(admin())
  assert.equal(res.status, 200)
  assert.equal(eliminar.mock.calls[0].arguments[0], 7)
})

test('DELETE /horarios/:id → 500 si falla el modelo', async () => {
  mock.method(Horario, 'porId', async () => fallo())
  assert.equal((await request(app).delete('/api/horarios/7').set(admin())).status, 500)
})
