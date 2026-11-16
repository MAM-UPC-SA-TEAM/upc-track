import { describe, it, expect } from 'vitest'
import {
  distanciaKm, calcularETA, formatearETA, velocidadParaETA, minutosHasta, tieneVelocidadReciente,
  VELOCIDAD_DEFECTO_KMH, VELOCIDAD_MIN_KMH, VELOCIDAD_MAX_KMH,
} from '../../src/utils/calcularETA'

describe('distanciaKm (Haversine)', () => {
  it('es 0 para el mismo punto', () => expect(distanciaKm(10, -73, 10, -73)).toBe(0))
  it('1° de latitud ≈ 111,19 km', () => expect(distanciaKm(0, 0, 1, 0)).toBeCloseTo(111.19, 1))
  it('es simétrica', () =>
    expect(distanciaKm(10.47, -73.6, 10.5, -73.5)).toBeCloseTo(distanciaKm(10.5, -73.5, 10.47, -73.6), 10))
})

describe('calcularETA', () => {
  const parada = { lat: 0, lng: 0 }

  it('sin buses en recorrido no hay estimación', () => {
    const buses = [{ id_bus: 1, estado: 'detenido', lat: 0, lng: 0.01 }]
    expect(calcularETA(parada, buses)).toEqual({ etaMinutos: null, busCercano: null, distanciaKmVal: null })
  })

  it('ignora buses sin coordenadas', () => {
    expect(calcularETA(parada, [{ id_bus: 1, estado: 'en_recorrido', lat: null, lng: null }]).busCercano).toBeNull()
  })

  it('elige el bus en recorrido más cercano', () => {
    const buses = [
      { id_bus: 1, estado: 'en_recorrido', lat: 0, lng: 0.1 },
      { id_bus: 2, estado: 'en_recorrido', lat: 0, lng: 0.02 },
      { id_bus: 3, estado: 'detenido', lat: 0, lng: 0.001 }, // más cerca, pero no cuenta
    ]
    expect(calcularETA(parada, buses).busCercano.id_bus).toBe(2)
  })

  it('a 25 km/h, 25 km son 60 min y la distancia se redondea a 2 decimales', () => {
    const km25 = 25 / 111.19 // grados de latitud ≈ 25 km
    const r = calcularETA(parada, [{ id_bus: 1, estado: 'en_recorrido', lat: km25, lng: 0 }])
    expect(r.etaMinutos).toBe(60)
    expect(r.distanciaKmVal).toBeCloseTo(25, 1)
  })

  it('respeta una velocidad distinta', () => {
    const r = calcularETA(parada, [{ id_bus: 1, estado: 'en_recorrido', lat: 50 / 111.19, lng: 0 }], 50)
    expect(r.etaMinutos).toBe(60)
  })
})

describe('velocidad reciente para el ETA (U24)', () => {
  const KM = 1 / 111.19 // grados de latitud por km

  it('sin velocidad medida usa la de por defecto (25 km/h)', () => {
    expect(velocidadParaETA({})).toBe(VELOCIDAD_DEFECTO_KMH)
    expect(velocidadParaETA({ velocidad_kmh: null })).toBe(25)
    expect(velocidadParaETA({ velocidad_kmh: 'abc' })).toBe(25)
    expect(velocidadParaETA(undefined)).toBe(25)
  })

  it('usa la velocidad medida, con piso y techo', () => {
    expect(velocidadParaETA({ velocidad_kmh: 30 })).toBe(30)
    expect(velocidadParaETA({ velocidad_kmh: '32' })).toBe(32)
    expect(velocidadParaETA({ velocidad_kmh: 3 })).toBe(VELOCIDAD_MIN_KMH)
    expect(velocidadParaETA({ velocidad_kmh: 90 })).toBe(VELOCIDAD_MAX_KMH)
  })

  it('un bus detenido (0 km/h) no da una estimación infinita: manda el piso', () => {
    expect(velocidadParaETA({ velocidad_kmh: 0 })).toBe(10)
    expect(minutosHasta(5, { velocidad_kmh: 0 })).toBe(30)
    expect(Number.isFinite(minutosHasta(5, { velocidad_kmh: 0 }))).toBe(true)
  })

  it('tieneVelocidadReciente distingue cero de «sin dato»', () => {
    expect(tieneVelocidadReciente({ velocidad_kmh: 0 })).toBe(true)
    expect(tieneVelocidadReciente({ velocidad_kmh: null })).toBe(false)
    expect(tieneVelocidadReciente({})).toBe(false)
  })

  it('el mismo bus llega antes si va más rápido', () => {
    const parada = { lat: 0, lng: 0 }
    const lento = calcularETA(parada, [{ estado: 'en_recorrido', lat: 10 * KM, lng: 0 }])
    const rapido = calcularETA(parada, [{ estado: 'en_recorrido', lat: 10 * KM, lng: 0, velocidad_kmh: 40 }])
    expect(lento.etaMinutos).toBe(24) // 10 km a 25 km/h
    expect(rapido.etaMinutos).toBe(15) // 10 km a 40 km/h
  })

  it('elige el bus que llega antes, no solo el más cercano', () => {
    const parada = { lat: 0, lng: 0 }
    const buses = [
      { id_bus: 1, estado: 'en_recorrido', lat: 2 * KM, lng: 0, velocidad_kmh: 10 },   // 2 km a 10 → 12 min
      { id_bus: 2, estado: 'en_recorrido', lat: 3 * KM, lng: 0, velocidad_kmh: 40 },   // 3 km a 40 → 5 min
    ]
    const r = calcularETA(parada, buses)
    expect(r.busCercano.id_bus).toBe(2)
    expect(r.etaMinutos).toBe(5)
    expect(r.distanciaKmVal).toBeCloseTo(3, 1)
  })

  it('una velocidad fijada explícitamente manda sobre la de los buses', () => {
    const r = calcularETA({ lat: 0, lng: 0 }, [{ estado: 'en_recorrido', lat: 20 * KM, lng: 0, velocidad_kmh: 40 }], 20)
    expect(r.etaMinutos).toBe(60)
  })
})

describe('formatearETA', () => {
  it('null → «Sin estimación»', () => expect(formatearETA(null)).toBe('Sin estimación'))
  it('0 → «< 1 min»', () => expect(formatearETA(0)).toBe('< 1 min'))
  it('minutos normales', () => expect(formatearETA(12)).toBe('12 min'))
  it('30 aún se muestra exacto', () => expect(formatearETA(30)).toBe('30 min'))
  it('más de 30 → «> 30 min»', () => expect(formatearETA(31)).toBe('> 30 min'))
})
