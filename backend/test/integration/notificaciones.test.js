// Pruebas HTTP de /api/notificaciones: envío del conductor, emisión por Socket.IO e historial.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { default: app } = await import('../../src/app.js')
const { pool } = await import('../../src/config/database.js')
const { Notificacion } = await import('../../src/models/Notificacion.js')
const { generarToken } = await import('../../src/utils/jwt.js')

let query
beforeEach(() => {
  query = mock.method(pool, 'query', async () => ({ rows: [{ id_ruta: 3 }] }))
  mock.method(console, 'error', () => {})
})
afterEach(() => { mock.restoreAll(); app.set('io', undefined) })

const auth = (tipo, id = 2) => ({ Authorization: `Bearer ${generarToken({ id_usuario: id, tipo_usuario: tipo, nombre: 'Pedro' })}` })
const conductor = (id) => auth('conductor', id)
const estudiante = () => auth('estudiante')
const fallo = () => { throw new Error('BD caída') }

function ioFalso() {
  const emitidos = []
  app.set('io', { to: (room) => ({ emit: (evento, datos) => emitidos.push({ room, evento, datos }) }) })
  return emitidos
}

// ── Enviar ──────────────────────────────────────────────────
test('POST /notificaciones sin token → 401', async () => {
  assert.equal((await request(app).post('/api/notificaciones').send({})).status, 401)
})

test('POST /notificaciones: estudiante → 403', async () => {
  assert.equal((await request(app).post('/api/notificaciones').set(estudiante()).send({ tipo: 'info', mensaje: 'x' })).status, 403)
})

test('POST /notificaciones: faltan campos o mensaje en blanco → 400', async () => {
  const enviar = (cuerpo) => request(app).post('/api/notificaciones').set(conductor()).send(cuerpo)
  assert.equal((await enviar({})).status, 400)
  assert.equal((await enviar({ tipo: 'info' })).status, 400)
  assert.equal((await enviar({ tipo: 'info', mensaje: '   ' })).status, 400)
})

test('POST /notificaciones: tipo inválido → 400', async () => {
  const res = await request(app).post('/api/notificaciones').set(conductor()).send({ tipo: 'spam', mensaje: 'x' })
  assert.equal(res.status, 400)
  assert.match(res.body.error, /cambio_ruta, retraso o info/)
})

test('POST /notificaciones: conductor sin ruta asignada → 404', async () => {
  query.mock.mockImplementation(async () => ({ rows: [] }))
  const res = await request(app).post('/api/notificaciones').set(conductor()).send({ tipo: 'info', mensaje: 'x' })
  assert.equal(res.status, 404)
})

test('POST /notificaciones: guarda, responde 201 y emite a la sala de su ruta', async () => {
  const emitidos = ioFalso()
  const guardar = mock.method(Notificacion, 'guardar', async () => 55)
  const res = await request(app).post('/api/notificaciones').set(conductor(2)).send({ tipo: 'retraso', mensaje: '  Tráfico  ' })
  assert.equal(res.status, 201)
  assert.deepEqual(guardar.mock.calls[0].arguments[0], { id_ruta: 3, id_conductor: 2, tipo: 'retraso', mensaje: 'Tráfico' })
  assert.equal(res.body.notificacion.id_notificacion, 55)
  assert.equal(res.body.notificacion.nombre_conductor, 'Pedro')
  assert.equal(emitidos.length, 1)
  assert.equal(emitidos[0].room, 'ruta_3')
  assert.equal(emitidos[0].evento, 'notificacion:nueva')
  assert.equal(emitidos[0].datos.mensaje, 'Tráfico')
})

test('POST /notificaciones → 500 si falla la BD', async () => {
  query.mock.mockImplementation(async () => fallo())
  const res = await request(app).post('/api/notificaciones').set(conductor()).send({ tipo: 'info', mensaje: 'x' })
  assert.equal(res.status, 500)
})

// ── Historial ───────────────────────────────────────────────
test('GET /notificaciones sin token → 401', async () => {
  assert.equal((await request(app).get('/api/notificaciones')).status, 401)
})

test('GET /notificaciones devuelve las de hoy', async () => {
  const hoy = mock.method(Notificacion, 'hoy', async () => [{ id_notificacion: 1 }])
  const res = await request(app).get('/api/notificaciones').set(estudiante())
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { notificaciones: [{ id_notificacion: 1 }] })
  assert.equal(hoy.mock.callCount(), 1)
})

test('GET /notificaciones?ruta_id=3 filtra por ruta', async () => {
  const porRuta = mock.method(Notificacion, 'porRutaHoy', async () => [])
  const res = await request(app).get('/api/notificaciones?ruta_id=3').set(estudiante())
  assert.equal(res.status, 200)
  assert.equal(porRuta.mock.calls[0].arguments[0], '3')
})

test('GET /notificaciones → 500 si falla el modelo', async () => {
  mock.method(Notificacion, 'hoy', async () => fallo())
  assert.equal((await request(app).get('/api/notificaciones').set(estudiante())).status, 500)
})
