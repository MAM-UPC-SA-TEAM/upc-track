import { describe, it, expect } from 'vitest'
import { busViejo, etiquetaBus } from '../../src/utils/estadoBus'

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
