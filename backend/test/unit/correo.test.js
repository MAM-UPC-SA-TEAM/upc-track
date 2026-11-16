import { test } from 'node:test'
import assert from 'node:assert/strict'
import { esCorreoPermitido, dominiosPermitidos, normalizarCorreo, mensajeCorreoNoPermitido } from '../../src/utils/correo.js'

const P = ['unicesar.edu.co']

test('acepta el dominio institucional, sin importar mayúsculas ni espacios', () => {
  assert.equal(esCorreoPermitido('ana@unicesar.edu.co', P), true)
  assert.equal(esCorreoPermitido('  Ana.Perez@UNICESAR.EDU.CO ', P), true)
})

test('rechaza correos de otros dominios', () => {
  for (const c of ['ana@gmail.com', 'ana@upc.edu.co', 'ana@unicesar.edu', 'ana@edu.co']) {
    assert.equal(esCorreoPermitido(c, P), false, c)
  }
})

test('rechaza suplantación del dominio', () => {
  const malos = [
    'x@unicesar.edu.co.evil.com',   // el dominio real queda como prefijo
    'x@evilunicesar.edu.co',        // sufijo parecido
    'x@sub.unicesar.edu.co',        // subdominio no listado
    'unicesar.edu.co@evil.com',     // el dominio solo en la parte local
    'x@evil.com@unicesar.edu.co@evil.com',
  ]
  assert.equal(esCorreoPermitido(malos[0], P), false)
  assert.equal(esCorreoPermitido(malos[1], P), false)
  assert.equal(esCorreoPermitido(malos[2], P), false)
  assert.equal(esCorreoPermitido(malos[3], P), false)
  assert.equal(esCorreoPermitido(malos[4], P), false)
  assert.equal(esCorreoPermitido('x y@unicesar.edu.co', P), false)
})

test('rechaza caracteres Unicode engañosos (homoglifos, ancho cero)', () => {
  assert.equal(esCorreoPermitido('x@unicеsar.edu.co', P), false)   // «е» cirílica
  assert.equal(esCorreoPermitido('x@unicesar.edu.co​', P), false)  // ancho cero al final
  assert.equal(esCorreoPermitido('x@uni​cesar.edu.co', P), false)  // ancho cero dentro
  assert.equal(esCorreoPermitido('аna@unicesar.edu.co', P), false) // «а» cirílica en la parte local
})

test('rechaza vacío, sin arroba y sin parte local', () => {
  for (const c of ['', '   ', null, undefined, 'unicesar.edu.co', '@unicesar.edu.co']) {
    assert.equal(esCorreoPermitido(c, P), false, String(c))
  }
})

test('la variable DOMINIOS_CORREO_PERMITIDOS admite varios dominios y tiene valor por defecto', () => {
  assert.deepEqual(dominiosPermitidos({}), ['unicesar.edu.co'])
  assert.deepEqual(dominiosPermitidos({ DOMINIOS_CORREO_PERMITIDOS: ' A.com , b.org ,, ' }), ['a.com', 'b.org'])
  assert.deepEqual(dominiosPermitidos({ DOMINIOS_CORREO_PERMITIDOS: ' , ' }), ['unicesar.edu.co'])
  assert.equal(esCorreoPermitido('x@b.org', ['a.com', 'b.org']), true)
})

test('normaliza y da un mensaje claro', () => {
  assert.equal(normalizarCorreo('  A@B.CO '), 'a@b.co')
  assert.equal(normalizarCorreo(null), '')
  assert.equal(mensajeCorreoNoPermitido(P), 'Usa tu correo institucional @unicesar.edu.co')
})
