import '../helpers/env.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const { authMiddleware, roleMiddleware } = await import('../../src/middlewares/authMiddleware.js')
const { generarToken } = await import('../../src/utils/jwt.js')

// Respuesta falsa mínima: registra status y json
function crearRes() {
  const res = { codigo: null, cuerpo: null }
  res.status = (c) => { res.codigo = c; return res }
  res.json = (b) => { res.cuerpo = b; return res }
  return res
}

test('authMiddleware: sin cabecera responde 401', () => {
  const res = crearRes()
  let llamado = false
  authMiddleware({ headers: {} }, res, () => { llamado = true })
  assert.equal(res.codigo, 401)
  assert.equal(res.cuerpo.error, 'Token no proporcionado')
  assert.equal(llamado, false)
})

test('authMiddleware: esquema distinto de Bearer responde 401', () => {
  const res = crearRes()
  authMiddleware({ headers: { authorization: 'Basic abc' } }, res, () => {})
  assert.equal(res.codigo, 401)
})

test('authMiddleware: token inválido responde 401', () => {
  const res = crearRes()
  authMiddleware({ headers: { authorization: 'Bearer basura' } }, res, () => {})
  assert.equal(res.codigo, 401)
  assert.equal(res.cuerpo.error, 'Token inválido o expirado')
})

test('authMiddleware: token válido llena req.usuario y llama next', () => {
  const token = generarToken({ id_usuario: 3, tipo_usuario: 'conductor' })
  const req = { headers: { authorization: `Bearer ${token}` } }
  let llamado = false
  authMiddleware(req, crearRes(), () => { llamado = true })
  assert.equal(llamado, true)
  assert.equal(req.usuario.id_usuario, 3)
})

test('roleMiddleware: permite un rol autorizado', () => {
  let llamado = false
  roleMiddleware('conductor', 'admin')({ usuario: { tipo_usuario: 'admin' } }, crearRes(), () => { llamado = true })
  assert.equal(llamado, true)
})

test('roleMiddleware: rechaza otro rol con 403', () => {
  const res = crearRes()
  roleMiddleware('admin')({ usuario: { tipo_usuario: 'estudiante' } }, res, () => {})
  assert.equal(res.codigo, 403)
})

test('roleMiddleware: sin usuario responde 403', () => {
  const res = crearRes()
  roleMiddleware('admin')({}, res, () => {})
  assert.equal(res.codigo, 403)
})
