// Movimiento suave del marcador del bus (U30): reglas de cuándo animar y cómo.
import { describe, it, expect } from 'vitest'
import {
  debeAnimar, duracionMovimiento, interpolar,
  SALTO_MAX_M, DESPLAZAMIENTO_MIN_M, DURACION_MIN_MS, DURACION_MAX_MS,
} from '../../src/utils/interpolar'

describe('debeAnimar', () => {
  it('anima un avance normal entre dos posiciones (~28 m cada 4 s)', () => {
    expect(debeAnimar({ distanciaM: 28, intervaloMs: 4000 })).toBe(true)
  })
  it('la primera posición no se anima (no hay de dónde venir)', () => {
    expect(debeAnimar({ distanciaM: 28, intervaloMs: 0 })).toBe(false)
  })
  it('un salto grande (reconexión, GPS) se coloca de una vez', () => {
    expect(debeAnimar({ distanciaM: SALTO_MAX_M + 1, intervaloMs: 4000 })).toBe(false)
    expect(debeAnimar({ distanciaM: SALTO_MAX_M, intervaloMs: 4000 })).toBe(true)
  })
  it('un movimiento de menos de medio metro es ruido: no se anima', () => {
    expect(debeAnimar({ distanciaM: DESPLAZAMIENTO_MIN_M - 0.1, intervaloMs: 4000 })).toBe(false)
  })
  it('con «reducir movimiento» no se anima', () => {
    expect(debeAnimar({ distanciaM: 28, intervaloMs: 4000, reducirMovimiento: true })).toBe(false)
  })
})

describe('duracionMovimiento', () => {
  it('dura lo que tardó en llegar la posición, acotado', () => {
    expect(duracionMovimiento(4000)).toBe(4000)
    expect(duracionMovimiento(100)).toBe(DURACION_MIN_MS)
    expect(duracionMovimiento(60_000)).toBe(DURACION_MAX_MS)
  })
})

describe('interpolar', () => {
  const a = [8.3, -73.6]
  const b = [8.302, -73.598]
  it('en 0 está en el origen y en 1 en el destino', () => {
    expect(interpolar(a, b, 0)).toEqual(a)
    expect(interpolar(a, b, 1)).toEqual(b)
  })
  it('es lineal: a la mitad, el punto medio', () => {
    const [lat, lng] = interpolar(a, b, 0.5)
    expect(lat).toBeCloseTo(8.301, 10)
    expect(lng).toBeCloseTo(-73.599, 10)
  })
  it('no se pasa del trayecto aunque el reloj se adelante', () => {
    expect(interpolar(a, b, 1.7)).toEqual(b)
    expect(interpolar(a, b, -0.3)).toEqual(a)
  })
})
