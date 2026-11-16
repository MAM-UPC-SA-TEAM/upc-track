// cicloVida en navegador: «reanudar» con visibilitychange y pila del botón atrás.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

async function cargar() {
  vi.resetModules()
  vi.doMock('@capacitor/app', () => ({ App: { addListener: vi.fn(), exitApp: vi.fn() } }))
  return import('../../src/services/cicloVida')
}

function visibilidad(estado) {
  Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(1_000_000)
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
})
afterEach(() => vi.useRealTimers())

describe('alReanudar / enPrimerPlano', () => {
  it('avisa cuánto tiempo estuvo oculta al volver', async () => {
    const { alReanudar, enPrimerPlano } = await cargar()
    const cb = vi.fn()
    alReanudar(cb)
    expect(enPrimerPlano()).toBe(true)
    visibilidad('hidden')
    expect(enPrimerPlano()).toBe(false)
    vi.advanceTimersByTime(40_000)
    visibilidad('visible')
    expect(cb).toHaveBeenCalledWith(40_000)
    expect(enPrimerPlano()).toBe(true)
  })

  it('volver visible sin haber estado oculta no avisa', async () => {
    const { alReanudar } = await cargar()
    const cb = vi.fn()
    alReanudar(cb)
    visibilidad('visible')
    expect(cb).not.toHaveBeenCalled()
  })

  it('un segundo «hidden» no reinicia el conteo', async () => {
    const { alReanudar } = await cargar()
    const cb = vi.fn()
    alReanudar(cb)
    visibilidad('hidden')
    vi.advanceTimersByTime(10_000)
    visibilidad('hidden')
    vi.advanceTimersByTime(10_000)
    visibilidad('visible')
    expect(cb).toHaveBeenCalledWith(20_000)
  })

  it('la función devuelta deja de avisar', async () => {
    const { alReanudar } = await cargar()
    const cb = vi.fn()
    alReanudar(cb)()
    visibilidad('hidden')
    visibilidad('visible')
    expect(cb).not.toHaveBeenCalled()
  })

  it('si la pestaña ya nace oculta, cuenta desde la carga', async () => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    const { enPrimerPlano } = await cargar()
    expect(enPrimerPlano()).toBe(false)
  })
})

describe('alAtras / escucharBotonAtras (web)', () => {
  it('en web escucharBotonAtras no hace nada y devuelve una función', async () => {
    const { escucharBotonAtras } = await cargar()
    const quitar = escucharBotonAtras(vi.fn())
    expect(typeof quitar).toBe('function')
    expect(() => quitar()).not.toThrow()
  })

  it('alAtras devuelve una función que quita el atendedor', async () => {
    const { alAtras } = await cargar()
    expect(() => alAtras(() => true)()).not.toThrow()
  })

  it('salirDeLaApp pide salir a Capacitor', async () => {
    const { salirDeLaApp } = await cargar()
    const { App } = await import('@capacitor/app')
    salirDeLaApp()
    expect(App.exitApp).toHaveBeenCalled()
  })
})
