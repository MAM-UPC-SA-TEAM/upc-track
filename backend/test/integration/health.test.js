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
