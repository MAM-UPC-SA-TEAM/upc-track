// Pruebas de integración HTTP sobre app.js (sin levantar puerto ni tocar la BD).
import '../helpers/env.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

const { default: app } = await import('../../src/app.js')

test('GET /api/health responde 200 con status ok', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'ok')
})

test('una ruta inexistente responde 404 en JSON', async () => {
  const res = await request(app).get('/api/no-existe')
  assert.equal(res.status, 404)
  assert.deepEqual(res.body, { error: 'Ruta no encontrada' })
})

// ── Endurecimiento (D09) ─────────────────────────────────────
test('las respuestas llevan cabeceras de seguridad y no revelan Express', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.headers['x-content-type-options'], 'nosniff')
  assert.match(res.headers['strict-transport-security'], /max-age=/)
  assert.equal(res.headers['x-powered-by'], undefined)
})

test('helmet no rompe el consumo cruzado: el origen permitido recibe CORS y los recursos se pueden leer desde otro origen', async () => {
  const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173')
  assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173')
  assert.equal(res.headers['cross-origin-resource-policy'], 'cross-origin')
})

test('un Origin desconocido no recibe cabeceras CORS (el navegador lo bloquea)', async () => {
  const res = await request(app).options('/api/auth/login')
    .set('Origin', 'https://malicioso.example')
    .set('Access-Control-Request-Method', 'POST')
  assert.equal(res.headers['access-control-allow-origin'], undefined)
})
