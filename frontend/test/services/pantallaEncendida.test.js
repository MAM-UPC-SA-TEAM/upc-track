// pantallaEncendida: pide el Wake Lock al iniciar, lo repite al volver de segundo plano y lo suelta al terminar.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

function visibilidad(estado) {
  Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

let candados
async function cargar(soporta = true) {
  vi.resetModules()
  vi.doMock('@capacitor/app', () => ({ App: { addListener: vi.fn(), exitApp: vi.fn() } }))
  candados = []
  if (soporta) {
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: vi.fn(async () => {
          const c = { release: vi.fn(async () => {}), addEventListener: vi.fn() }
          candados.push(c)
          return c
        }),
      },
    })
  } else {
    delete navigator.wakeLock
  }
  return import('../../src/services/pantallaEncendida')
}

beforeEach(() => Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }))
afterEach(() => { delete navigator.wakeLock })

describe('pantallaEncendida', () => {
  it('mantener() pide el bloqueo una sola vez aunque se llame varias', async () => {
    const { mantener, liberar } = await cargar()
    mantener(); mantener()
    await Promise.resolve()
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1)
    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen')
    liberar()
  })

  it('al volver de segundo plano lo vuelve a pedir si el sistema lo soltó', async () => {
    const { mantener, liberar } = await cargar()
    mantener()
    await Promise.resolve()
    // el sistema lo suelta al ocultar la app
    candados[0].addEventListener.mock.calls[0][1]()
    visibilidad('hidden')
    visibilidad('visible')
    await Promise.resolve()
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(2)
    liberar()
  })

  it('liberar() suelta el bloqueo y deja de reaccionar a volver de segundo plano', async () => {
    const { mantener, liberar } = await cargar()
    mantener()
    await Promise.resolve()
    liberar()
    expect(candados[0].release).toHaveBeenCalledTimes(1)
    visibilidad('hidden')
    visibilidad('visible')
    await Promise.resolve()
    expect(navigator.wakeLock.request).toHaveBeenCalledTimes(1)
  })

  it('si se libera mientras el sistema aún respondía, suelta el bloqueo recién concedido', async () => {
    const { mantener, liberar } = await cargar()
    mantener()
    liberar() // antes de que resuelva request()
    await Promise.resolve(); await Promise.resolve()
    expect(candados[0].release).toHaveBeenCalled()
  })

  it('sin soporte de Wake Lock no falla', async () => {
    const { mantener, liberar } = await cargar(false)
    expect(() => { mantener(); liberar() }).not.toThrow()
  })
})
