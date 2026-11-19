// Manejo de errores centralizado (B05): HttpError, asyncHandler y errorHandler sobre una app mínima.
import '../helpers/env.js'
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import request from 'supertest'

const { HttpError, badRequest, unauthorized, forbidden, notFound, conflict } = await import('../../src/utils/httpError.js')
const { asyncHandler, errorHandler, rutaNoEncontrada } = await import('../../src/middlewares/errorMiddleware.js')

let consola
beforeEach(() => { consola = mock.method(console, 'error', () => {}) })
afterEach(() => mock.restoreAll())

function app(montar) {
  const a = express()
  a.use(express.json())
  montar(a)
  a.use(rutaNoEncontrada)
  a.use(errorHandler)
  return a
}

test('HttpError: guarda el código y el mensaje público; el detalle interno solo va en message', () => {
  const e = new HttpError(403, 'Origen no permitido', { detalle: 'Origin no permitido por CORS: x', extra: { codigo: 'C' } })
  assert.equal(e.status, 403)
  assert.equal(e.publico, 'Origen no permitido')
  assert.equal(e.message, 'Origin no permitido por CORS: x')
  assert.deepEqual(e.extra, { codigo: 'C' })
  assert.ok(e instanceof Error)
  assert.equal(new HttpError(400, 'x').message, 'x')
})

test('atajos: cada uno fija su código HTTP', () => {
  assert.deepEqual([badRequest('a'), unauthorized('a'), forbidden('a'), notFound('a'), conflict('a')].map((e) => e.status), [400, 401, 403, 404, 409])
})

test('un handler que responde bien no toca el flujo de errores', async () => {
  const a = app((x) => x.get('/ok', asyncHandler(async (_req, res) => res.status(200).json({ ok: true }))))
  const res = await request(a).get('/ok')
  assert.equal(res.status, 200)
  assert.equal(consola.mock.callCount(), 0)
})

test('un HttpError lanzado responde con su código y { error }', async () => {
  const a = app((x) => x.get('/x', asyncHandler(async () => { throw notFound('Bus no encontrado') })))
  const res = await request(a).get('/x')
  assert.equal(res.status, 404)
  assert.deepEqual(res.body, { error: 'Bus no encontrado' })
  assert.equal(consola.mock.callCount(), 0, 'un 404 esperado no se registra como error')
})

test('un error de dominio se traduce con la tabla del handler, incluidos los campos extra', async () => {
  const a = app((x) => x.get('/x', asyncHandler(async () => { throw new Error('CUENTA_INACTIVA') }, {
    CUENTA_INACTIVA: [403, 'Tu cuenta aún no está activa.', { codigo: 'CUENTA_INACTIVA' }],
  })))
  const res = await request(a).get('/x')
  assert.equal(res.status, 403)
  assert.deepEqual(res.body, { error: 'Tu cuenta aún no está activa.', codigo: 'CUENTA_INACTIVA' })
})

test('un error de dominio sin traducción en ese handler es un 500 genérico y se registra', async () => {
  const a = app((x) => x.get('/x', asyncHandler(async () => { throw new Error('PLACA_DUPLICADA') }, { OTRO: [400, 'x'] })))
  const res = await request(a).get('/x')
  assert.equal(res.status, 500)
  assert.deepEqual(res.body, { error: 'Error interno del servidor' })
  assert.equal(consola.mock.callCount(), 1)
})

test('un error inesperado: 500 sin filtrar el mensaje interno, y se registra con método y ruta', async () => {
  const a = app((x) => x.get('/x', asyncHandler(async () => { throw new Error('conexión a 10.0.0.5 rechazada') })))
  const res = await request(a).get('/x?q=1')
  assert.equal(res.status, 500)
  assert.deepEqual(res.body, { error: 'Error interno del servidor' })
  assert.match(consola.mock.calls[0].arguments[0], /GET \/x\?q=1/)
})

test('los nombres de la tabla no se confunden con propiedades heredadas (p. ej. «constructor»)', async () => {
  const a = app((x) => x.get('/x', asyncHandler(async () => { throw new Error('constructor') }, {})))
  assert.equal((await request(a).get('/x')).status, 500)
})

test('un JSON mal formado es un 400 en JSON (antes una página HTML) y un cuerpo enorme, 413', async () => {
  const a = app((x) => x.post('/x', asyncHandler(async (_req, res) => res.json({ ok: true }))))
  const malo = await request(a).post('/x').set('Content-Type', 'application/json').send('{"a": ')
  assert.equal(malo.status, 400)
  assert.deepEqual(malo.body, { error: 'El cuerpo de la petición no es un JSON válido' })
  const grande = await request(a).post('/x').set('Content-Type', 'application/json').send(JSON.stringify({ a: 'x'.repeat(200 * 1024) }))
  assert.equal(grande.status, 413)
  assert.deepEqual(grande.body, { error: 'El cuerpo de la petición es demasiado grande' })
})

test('una ruta inexistente responde 404 en JSON', async () => {
  const res = await request(app(() => {})).get('/nada')
  assert.equal(res.status, 404)
  assert.deepEqual(res.body, { error: 'Ruta no encontrada' })
})

test('si la respuesta ya empezó, el error se delega a Express (no intenta responder dos veces)', () => {
  const llamadas = []
  const res = { headersSent: true }
  errorHandler(new Error('x'), { method: 'GET', originalUrl: '/' }, res, (e) => llamadas.push(e))
  assert.equal(llamadas.length, 1)
})
