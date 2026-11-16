// Velocidad reciente del bus para el ETA (U24): desplazamiento en la última ventana, sin inventar velocidad con GPS temblando.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { velocidadKmh, distanciaMetros, VENTANA_MS, VELOCIDAD_MAX_KMH } from '../../src/utils/velocidad.js'

const METROS_POR_GRADO_LAT = 111_195
const T0 = 1_000_000_000

// Posiciones cada 4 s hacia el norte a `kmh`; la última es «ahora»
function recorrido({ kmh, n = 8, cada = 4000, lat0 = 8.3, lng = -73.6 }) {
  const mPorSeg = kmh / 3.6
  return Array.from({ length: n }, (_, i) => ({
    lat: lat0 + (mPorSeg * (i * cada / 1000)) / METROS_POR_GRADO_LAT,
    lng,
    t: T0 + i * cada,
  }))
}
const ahoraDe = (pos) => pos[pos.length - 1].t

test('distanciaMetros: un grado de latitud son ~111 km', () => {
  assert.ok(Math.abs(distanciaMetros(0, 0, 1, 0) - METROS_POR_GRADO_LAT) < 200)
})

test('un bus a 25 km/h mide ~25 km/h', () => {
  const p = recorrido({ kmh: 25 })
  const v = velocidadKmh(p, ahoraDe(p))
  assert.ok(Math.abs(v - 25) < 0.5, `esperaba ~25, dio ${v}`)
})

test('un bus a 38 km/h mide ~38 km/h', () => {
  const p = recorrido({ kmh: 38 })
  assert.ok(Math.abs(velocidadKmh(p, ahoraDe(p)) - 38) < 0.5)
})

test('con menos de 3 posiciones no hay velocidad', () => {
  const p = recorrido({ kmh: 25, n: 2 })
  assert.equal(velocidadKmh(p, ahoraDe(p)), null)
  assert.equal(velocidadKmh([], T0), null)
})

test('con menos de 20 s entre la primera y la última no hay velocidad', () => {
  const p = recorrido({ kmh: 25, n: 4, cada: 4000 }) // 12 s
  assert.equal(velocidadKmh(p, ahoraDe(p)), null)
})

test('un bus detenido con el GPS temblando mide casi 0, no una velocidad inventada', () => {
  const p = recorrido({ kmh: 0, n: 10 }).map((q, i) => ({
    ...q,
    lat: q.lat + ((i % 2 ? 6 : -6) / METROS_POR_GRADO_LAT), // ±6 m de ruido cada 4 s
  }))
  const v = velocidadKmh(p, ahoraDe(p))
  assert.ok(v < 2, `esperaba casi 0, dio ${v}`)
})

test('las posiciones de hace más de un minuto no cuentan', () => {
  const viejas = recorrido({ kmh: 60, n: 6 })
  const ahora = ahoraDe(viejas) + VENTANA_MS + 5000
  assert.equal(velocidadKmh(viejas, ahora), null)

  // mezcla: viejas rápidas + recientes lentas → manda lo reciente
  const recientes = recorrido({ kmh: 12, n: 8 }).map((p) => ({ ...p, t: p.t + VENTANA_MS + 5000 }))
  const v = velocidadKmh([...viejas, ...recientes], ahoraDe(recientes))
  assert.ok(Math.abs(v - 12) < 0.5, `esperaba ~12, dio ${v}`)
})

test('un salto del GPS (más de 120 km/h) se descarta', () => {
  const p = recorrido({ kmh: VELOCIDAD_MAX_KMH + 60 })
  assert.equal(velocidadKmh(p, ahoraDe(p)), null)
})

test('una posición «del futuro» (reloj corrido) no cuenta', () => {
  const p = recorrido({ kmh: 25 })
  assert.equal(velocidadKmh(p, p[0].t - 10_000), null)
})
