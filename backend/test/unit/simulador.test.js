// Geometría del simulador de recorrido (scripts/dev/simular-recorrido.mjs)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { distanciaM, largoM, posicionEnRuta, idaYVuelta } from '../../../scripts/dev/simular-recorrido.mjs'

const A = { lat: 0, lng: 0 }
const B = { lat: 0.01, lng: 0 } // ~1,112 km al norte
const C = { lat: 0.01, lng: 0.01 } // ~1,112 km al este de B

test('distanciaM: 0,01° de latitud son ~1112 m, y es simétrica', () => {
  assert.ok(Math.abs(distanciaM(A, B) - 1111.95) < 1)
  assert.equal(distanciaM(A, B), distanciaM(B, A))
  assert.equal(distanciaM(A, A), 0)
})

test('largoM: suma los tramos de la línea quebrada', () => {
  assert.ok(Math.abs(largoM([A, B, C]) - 2 * 1111.95) < 2)
})

test('posicionEnRuta: a mitad del primer tramo está en el punto medio y el índice es el tramo', () => {
  const p = posicionEnRuta([A, B, C], distanciaM(A, B) / 2)
  assert.ok(Math.abs(p.lat - 0.005) < 1e-6)
  assert.equal(p.lng, 0)
  assert.equal(p.indice, 0)
})

test('posicionEnRuta: cruza al segundo tramo y se queda en los extremos', () => {
  const en2 = posicionEnRuta([A, B, C], distanciaM(A, B) + distanciaM(B, C) / 2)
  assert.ok(Math.abs(en2.lat - 0.01) < 1e-6)
  assert.ok(Math.abs(en2.lng - 0.005) < 1e-6)
  assert.equal(en2.indice, 1)
  assert.deepEqual({ lat: posicionEnRuta([A, B, C], -5).lat, lng: posicionEnRuta([A, B, C], -5).lng }, A)
  const fin = posicionEnRuta([A, B, C], 1e9)
  assert.deepEqual({ lat: fin.lat, lng: fin.lng }, C)
  assert.equal(fin.indice, 2)
})

test('posicionEnRuta: con un solo punto es un error claro, no NaN', () => {
  assert.throws(() => posicionEnRuta([A], 10), /al menos 2 puntos/)
})

test('idaYVuelta: las paradas y luego las mismas al revés sin repetir la última', () => {
  const v = idaYVuelta([A, B, C])
  assert.deepEqual(v, [A, B, C, B, A])
  assert.equal(idaYVuelta([A, B]).length, 3)
})
