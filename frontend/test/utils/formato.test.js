import { describe, it, expect } from 'vitest'
import { textoEdad, textoHace } from '../../src/utils/formato'

describe('textoEdad', () => {
  it('devuelve vacío si no hay dato', () => expect(textoEdad(null)).toBe(''))
  it('usa segundos hasta 89 s', () => expect(textoEdad(12)).toBe('12 s'))
  it('pasa a minutos desde 90 s', () => expect(textoEdad(120)).toBe('2 min'))
})

describe('textoHace', () => {
  const ahora = new Date('2026-01-01T12:00:00Z').getTime()
  it('«Ahora» si pasó menos de un minuto', () =>
    expect(textoHace('2026-01-01T11:59:40Z', ahora)).toBe('Ahora'))
  it('minutos', () => expect(textoHace('2026-01-01T11:55:00Z', ahora)).toBe('Hace 5 min'))
  it('horas', () => expect(textoHace('2026-01-01T10:00:00Z', ahora)).toBe('Hace 2 h'))
  it('días', () => expect(textoHace('2025-12-29T12:00:00Z', ahora)).toBe('Hace 3 d'))
})
