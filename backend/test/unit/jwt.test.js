import '../helpers/env.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'

const { generarToken, verificarToken } = await import('../../src/utils/jwt.js')

test('generarToken y verificarToken conservan el payload', () => {
  const token = generarToken({ id_usuario: 7, tipo_usuario: 'admin' })
  const payload = verificarToken(token)
  assert.equal(payload.id_usuario, 7)
  assert.equal(payload.tipo_usuario, 'admin')
  assert.ok(payload.exp > payload.iat)
})

test('verificarToken rechaza un token firmado con otro secreto', () => {
  const ajeno = jwt.sign({ id_usuario: 1 }, 'otro-secreto')
  assert.throws(() => verificarToken(ajeno))
})

test('verificarToken rechaza un token vencido', () => {
  const vencido = jwt.sign({ id_usuario: 1 }, process.env.JWT_SECRET, { expiresIn: -10 })
  assert.throws(() => verificarToken(vencido), { name: 'TokenExpiredError' })
})

test('verificarToken rechaza basura', () => {
  assert.throws(() => verificarToken('no-es-un-jwt'))
})
