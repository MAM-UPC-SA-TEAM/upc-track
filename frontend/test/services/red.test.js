import { describe, it, expect, vi, beforeEach } from 'vitest'

// red.js guarda el estado en variables de módulo: se reimporta limpio en cada prueba.
async function cargarRed(online = true) {
  vi.resetModules()
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })
  return import('../../src/services/red')
}

beforeEach(() => vi.restoreAllMocks())

describe('servicio de red (navegador)', () => {
  it('parte del estado actual del navegador', async () => {
    expect((await cargarRed(true)).hayRed()).toBe(true)
    expect((await cargarRed(false)).hayRed()).toBe(false)
  })

  it('el evento offline/online actualiza hayRed y avisa a los oyentes', async () => {
    const { hayRed, alCambiarRed } = await cargarRed(true)
    const cb = vi.fn()
    alCambiarRed(cb)
    window.dispatchEvent(new Event('offline'))
    expect(hayRed()).toBe(false)
    window.dispatchEvent(new Event('online'))
    expect(hayRed()).toBe(true)
    expect(cb.mock.calls.map((c) => c[0])).toEqual([false, true])
  })

  it('no avisa si el estado no cambió', async () => {
    const { alCambiarRed } = await cargarRed(true)
    const cb = vi.fn()
    alCambiarRed(cb)
    window.dispatchEvent(new Event('online'))
    expect(cb).not.toHaveBeenCalled()
  })

  it('la función devuelta deja de escuchar', async () => {
    const { alCambiarRed } = await cargarRed(true)
    const cb = vi.fn()
    const quitar = alCambiarRed(cb)
    quitar()
    window.dispatchEvent(new Event('offline'))
    expect(cb).not.toHaveBeenCalled()
  })
})
