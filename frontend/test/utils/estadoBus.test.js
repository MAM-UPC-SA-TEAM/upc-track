import { describe, it, expect } from 'vitest'
import { busViejo, etiquetaBus, actualizarAnclas, MARGEN_POSICION_NUEVA_MS } from '../../src/utils/estadoBus'

describe('estadoBus', () => {
  it('un bus en recorrido con dato fresco es «vivo»', () =>
    expect(etiquetaBus({ estado: 'en_recorrido' }, 10).tipo).toBe('vivo'))
  it('en recorrido con dato de más de 30 s es «viejo»', () =>
    expect(busViejo({ estado: 'en_recorrido' }, 31)).toBe(true))
  it('sin señal siempre es «viejo»', () =>
    expect(etiquetaBus({ estado: 'sin_senal' }, 0).tipo).toBe('viejo'))
  it('detenido es neutro', () =>
    expect(etiquetaBus({ estado: 'detenido' }, 5)).toEqual({ tipo: 'neutro', texto: 'Detenido' }))
})

describe('actualizarAnclas', () => {
  const T = 1_000_000
  const bus = (edad, id = 1) => ({ id_bus: id, edad_segundos: edad })

  it('un bus sin ancla previa la toma del momento de su posición', () => {
    expect(actualizarAnclas({}, [bus(3)], T)).toEqual({ 1: T - 3000 })
  })

  it('la misma posición consultada otra vez no mueve el ancla (la edad solo crece)', () => {
    const a = actualizarAnclas({}, [bus(3)], T)
    // 10 s después el servidor dice «13 s»: es la misma posición
    expect(actualizarAnclas(a, [bus(13)], T + 10_000)).toEqual(a)
  })

  it('el redondeo del servidor (±1 s) no mueve el ancla ni la hace retroceder', () => {
    const a = actualizarAnclas({}, [bus(3)], T)
    expect(actualizarAnclas(a, [bus(11)], T + 10_000)).toEqual(a) // 1 s de menos
    expect(actualizarAnclas(a, [bus(15)], T + 10_000)).toEqual(a) // 1 s de más
  })

  it('una posición nueva (más de 2,5 s después) avanza el ancla', () => {
    const a = actualizarAnclas({}, [bus(3)], T)
    const b = actualizarAnclas(a, [bus(1)], T + 10_000) // llegó hace 1 s
    expect(b[1]).toBe(T + 9000)
    expect(b[1] - a[1]).toBeGreaterThan(MARGEN_POSICION_NUEVA_MS)
  })

  it('cada bus tiene su ancla y los que ya no están se descartan', () => {
    const a = actualizarAnclas({}, [bus(2, 1), bus(5, 2)], T)
    expect(Object.keys(a)).toEqual(['1', '2'])
    expect(actualizarAnclas(a, [bus(4, 1)], T + 2000)).toEqual({ 1: a[1] })
  })
})
