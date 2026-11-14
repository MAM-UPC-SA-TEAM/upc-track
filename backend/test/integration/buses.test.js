// Pruebas HTTP de /api/buses: roles, validaciones y emisión por Socket.IO.
// Modelos y pool.query se mockean; no hay BD.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { default: app } = await import('../../src/app.js')
const { pool } = await import('../../src/config/database.js')
const { Bus } = await import('../../src/models/Bus.js')
const { Notificacion } = await import('../../src/models/Notificacion.js')
const { generarToken } = await import('../../src/utils/jwt.js')

let query
beforeEach(() => {
  query = mock.method(pool, 'query', async () => ({ rows: [{ id_bus: 1 }] }))
  mock.method(console, 'error', () => {})
})
afterEach(() => { mock.restoreAll(); app.set('io', undefined) })

const auth = (tipo, id = 1) => ({ Authorization: `Bearer ${generarToken({ id_usuario: id, tipo_usuario: tipo, nombre: 'U' })}` })
const admin = () => auth('admin')
const conductor = (id = 2) => auth('conductor', id)
const estudiante = () => auth('estudiante')
const fallo = () => { throw new Error('BD caída') }

// io falso: registra cada emit con su room
function ioFalso() {
  const emitidos = []
  const io = { to: (room) => ({ emit: (evento, datos) => emitidos.push({ room, evento, datos }) }) }
  app.set('io', io)
  return emitidos
}

// ── Autenticación ───────────────────────────────────────────
test('GET /buses sin token → 401', async () => {
  assert.equal((await request(app).get('/api/buses')).status, 401)
})

// ── Lecturas ────────────────────────────────────────────────
const lecturas = [
  ['/api/buses', 'todos'],
  ['/api/buses/activos', 'activos'],
  ['/api/buses/todos-posicion', 'todosConPosicion'],
]
for (const [url, metodo] of lecturas) {
  test(`GET ${url} → 200 con la lista`, async () => {
    mock.method(Bus, metodo, async () => [{ id_bus: 1 }])
    const res = await request(app).get(url).set(estudiante())
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { buses: [{ id_bus: 1 }] })
  })
  test(`GET ${url} → 500 si falla el modelo`, async () => {
    mock.method(Bus, metodo, async () => fallo())
    assert.equal((await request(app).get(url).set(estudiante())).status, 500)
  })
}

test('GET /mi-bus: estudiante → 403', async () => {
  assert.equal((await request(app).get('/api/buses/mi-bus').set(estudiante())).status, 403)
})

test('GET /mi-bus: conductor con bus → 200 y consulta por su id', async () => {
  const m = mock.method(Bus, 'porConductor', async () => ({ id_bus: 3 }))
  const res = await request(app).get('/api/buses/mi-bus').set(conductor(9))
  assert.equal(res.status, 200)
  assert.equal(m.mock.calls[0].arguments[0], 9)
})

test('GET /mi-bus: conductor sin bus → 404', async () => {
  mock.method(Bus, 'porConductor', async () => null)
  assert.equal((await request(app).get('/api/buses/mi-bus').set(conductor())).status, 404)
})

test('GET /mi-bus → 500 si falla el modelo', async () => {
  mock.method(Bus, 'porConductor', async () => fallo())
  assert.equal((await request(app).get('/api/buses/mi-bus').set(conductor())).status, 500)
})

test('GET /:id existente → 200', async () => {
  mock.method(Bus, 'porId', async () => ({ id_bus: 5 }))
  const res = await request(app).get('/api/buses/5').set(estudiante())
  assert.equal(res.status, 200)
  assert.equal(res.body.bus.id_bus, 5)
})

test('GET /:id inexistente → 404', async () => {
  mock.method(Bus, 'porId', async () => null)
  assert.equal((await request(app).get('/api/buses/99').set(estudiante())).status, 404)
})

test('GET /:id → 500 si falla el modelo', async () => {
  mock.method(Bus, 'porId', async () => fallo())
  assert.equal((await request(app).get('/api/buses/5').set(estudiante())).status, 500)
})

// ── Crear ───────────────────────────────────────────────────
test('POST /buses: no admin → 403', async () => {
  assert.equal((await request(app).post('/api/buses').set(conductor()).send({ nombre: 'B', placa: 'P' })).status, 403)
})

test('POST /buses: faltan nombre o placa → 400', async () => {
  assert.equal((await request(app).post('/api/buses').set(admin()).send({ nombre: 'B' })).status, 400)
})

test('POST /buses: crea con valores por defecto y sin ruta', async () => {
  const res = await request(app).post('/api/buses').set(admin()).send({ nombre: 'B1', placa: 'ABC123' })
  assert.equal(res.status, 201)
  assert.equal(res.body.id_bus, 1)
  assert.deepEqual(query.mock.calls[0].arguments[1], ['B1', 'ABC123', 45, 'inactivo', null])
  assert.equal(query.mock.callCount(), 1)
})

test('POST /buses: con id_ruta también inserta en bus_ruta', async () => {
  const res = await request(app).post('/api/buses').set(admin())
    .send({ nombre: 'B1', placa: 'ABC123', capacidad: 30, id_ruta: 4 })
  assert.equal(res.status, 201)
  assert.equal(query.mock.callCount(), 2)
  assert.deepEqual(query.mock.calls[1].arguments[1], [1, 4])
})

test('POST /buses: placa duplicada → 400', async () => {
  query.mock.mockImplementation(async () => { throw Object.assign(new Error('dup'), { code: '23505' }) })
  const res = await request(app).post('/api/buses').set(admin()).send({ nombre: 'B', placa: 'P' })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /placa/)
})

test('POST /buses: error inesperado → 500', async () => {
  query.mock.mockImplementation(async () => fallo())
  assert.equal((await request(app).post('/api/buses').set(admin()).send({ nombre: 'B', placa: 'P' })).status, 500)
})

// ── Editar / eliminar ───────────────────────────────────────
test('PATCH /:id: conductor → 403', async () => {
  assert.equal((await request(app).patch('/api/buses/1').set(conductor()).send({})).status, 403)
})

test('PATCH /:id sin id_ruta solo actualiza el bus', async () => {
  const res = await request(app).patch('/api/buses/1').set(admin()).send({ nombre: 'N', placa: 'P', estado: 'inactivo' })
  assert.equal(res.status, 200)
  assert.equal(query.mock.callCount(), 1)
})

test('PATCH /:id con id_ruta reemplaza la asignación', async () => {
  const res = await request(app).patch('/api/buses/1').set(admin()).send({ nombre: 'N', placa: 'P', estado: 'inactivo', id_ruta: 7 })
  assert.equal(res.status, 200)
  assert.equal(query.mock.callCount(), 3)
  assert.match(query.mock.calls[1].arguments[0], /DELETE FROM bus_ruta/)
  assert.deepEqual(query.mock.calls[2].arguments[1], ['1', 7])
})

test('PATCH /:id con id_ruta nulo solo quita la asignación', async () => {
  const res = await request(app).patch('/api/buses/1').set(admin()).send({ nombre: 'N', placa: 'P', estado: 'inactivo', id_ruta: null })
  assert.equal(res.status, 200)
  assert.equal(query.mock.callCount(), 2)
})

test('PATCH /:id → 500 si falla la BD', async () => {
  query.mock.mockImplementation(async () => fallo())
  assert.equal((await request(app).patch('/api/buses/1').set(admin()).send({})).status, 500)
})

test('DELETE /:id: no admin → 403', async () => {
  assert.equal((await request(app).delete('/api/buses/1').set(conductor())).status, 403)
})

test('DELETE /:id: admin → 200', async () => {
  const res = await request(app).delete('/api/buses/1').set(admin())
  assert.equal(res.status, 200)
  assert.deepEqual(query.mock.calls[0].arguments[1], ['1'])
})

test('DELETE /:id → 500 si falla la BD', async () => {
  query.mock.mockImplementation(async () => fallo())
  assert.equal((await request(app).delete('/api/buses/1').set(admin())).status, 500)
})

// ── Cambiar estado ──────────────────────────────────────────
test('PATCH /:id/estado: admin → 403', async () => {
  assert.equal((await request(app).patch('/api/buses/1/estado').set(admin()).send({ estado: 'detenido' })).status, 403)
})

test('PATCH /:id/estado: estado inválido → 400', async () => {
  assert.equal((await request(app).patch('/api/buses/1/estado').set(conductor()).send({ estado: 'volando' })).status, 400)
})

test('PATCH /:id/estado sin io: actualiza y responde 200', async () => {
  const act = mock.method(Bus, 'actualizarEstado', async () => {})
  mock.method(Bus, 'porId', async () => ({ id_bus: 1, id_ruta: 3, nombre: 'B1' }))
  const res = await request(app).patch('/api/buses/1/estado').set(conductor()).send({ estado: 'detenido' })
  assert.equal(res.status, 200)
  assert.deepEqual(act.mock.calls[0].arguments, ['1', 'detenido'])
})

test('PATCH /:id/estado en_recorrido: guarda y emite notificación y bus:estado a la ruta', async () => {
  const emitidos = ioFalso()
  mock.method(Bus, 'actualizarEstado', async () => {})
  mock.method(Bus, 'porId', async () => ({ id_bus: 1, id_ruta: 3, nombre: 'B1', nombre_ruta: 'Ruta A' }))
  const guardar = mock.method(Notificacion, 'guardar', async () => 77)
  const res = await request(app).patch('/api/buses/1/estado').set(conductor(2)).send({ estado: 'en_recorrido' })
  assert.equal(res.status, 200)
  assert.equal(guardar.mock.calls[0].arguments[0].id_conductor, 2)
  assert.match(guardar.mock.calls[0].arguments[0].mensaje, /inició su recorrido en Ruta A/)
  assert.deepEqual(emitidos.map((e) => e.evento), ['notificacion:nueva', 'bus:estado'])
  assert.ok(emitidos.every((e) => e.room === 'ruta_3'))
  assert.equal(emitidos[0].datos.id_notificacion, 77)
  assert.deepEqual(emitidos[1].datos, { id_bus: 1, estado: 'en_recorrido' })
})

test('PATCH /:id/estado inactivo: emite bus:estado pero no notifica', async () => {
  const emitidos = ioFalso()
  mock.method(Bus, 'actualizarEstado', async () => {})
  mock.method(Bus, 'porId', async () => ({ id_bus: 1, id_ruta: 3, nombre: 'B1' }))
  const guardar = mock.method(Notificacion, 'guardar', async () => 1)
  const res = await request(app).patch('/api/buses/1/estado').set(conductor()).send({ estado: 'inactivo' })
  assert.equal(res.status, 200)
  assert.equal(guardar.mock.callCount(), 0)
  assert.deepEqual(emitidos.map((e) => e.evento), ['bus:estado'])
})

test('PATCH /:id/estado de un bus sin ruta no emite nada', async () => {
  const emitidos = ioFalso()
  mock.method(Bus, 'actualizarEstado', async () => {})
  mock.method(Bus, 'porId', async () => ({ id_bus: 1, id_ruta: null, nombre: 'B1' }))
  const res = await request(app).patch('/api/buses/1/estado').set(conductor()).send({ estado: 'detenido' })
  assert.equal(res.status, 200)
  assert.equal(emitidos.length, 0)
})

test('PATCH /:id/estado → 500 si falla el modelo', async () => {
  mock.method(Bus, 'actualizarEstado', async () => fallo())
  assert.equal((await request(app).patch('/api/buses/1/estado').set(conductor()).send({ estado: 'detenido' })).status, 500)
})
