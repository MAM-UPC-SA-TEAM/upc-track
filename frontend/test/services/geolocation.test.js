// verificarPermiso: decide si se puede empezar a transmitir sin esperar un fix de GPS (M12).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

async function cargar({ nativa = false, plugin } = {}) {
  vi.resetModules()
  vi.doMock('../../src/utils/platform', () => ({ esNativa: nativa }))
  vi.doMock('@capacitor/geolocation', () => ({ Geolocation: plugin || {} }))
  return import('../../src/services/geolocation')
}

const permisos = (state) => Object.defineProperty(navigator, 'permissions', {
  configurable: true,
  value: state === undefined ? undefined : { query: vi.fn(async () => ({ state })) },
})
const seguro = (v) => Object.defineProperty(window, 'isSecureContext', { configurable: true, value: v })

beforeEach(() => seguro(true))
afterEach(() => { delete navigator.permissions; vi.restoreAllMocks() })

describe('verificarPermiso — web', () => {
  it('permiso ya concedido: sigue', async () => {
    permisos('granted')
    const { verificarPermiso } = await cargar()
    await expect(verificarPermiso()).resolves.toBeUndefined()
  })

  it('permiso «por preguntar»: sigue (el navegador pregunta al escuchar la posición)', async () => {
    permisos('prompt')
    const { verificarPermiso } = await cargar()
    await expect(verificarPermiso()).resolves.toBeUndefined()
  })

  it('permiso denegado: lanza permiso_denegado con cómo activarlo', async () => {
    permisos('denied')
    const { verificarPermiso } = await cargar()
    await expect(verificarPermiso()).rejects.toMatchObject({ codigo: 'permiso_denegado', mensaje: expect.stringMatching(/permisos del sitio/) })
  })

  it('página sin HTTPS: lanza inseguro', async () => {
    seguro(false)
    permisos('granted')
    const { verificarPermiso } = await cargar()
    await expect(verificarPermiso()).rejects.toMatchObject({ codigo: 'inseguro' })
  })

  it('sin Permissions API: sigue (se intenta igual)', async () => {
    permisos(undefined)
    const { verificarPermiso } = await cargar()
    await expect(verificarPermiso()).resolves.toBeUndefined()
  })
})

describe('verificarPermiso — app nativa', () => {
  it('concedido: no vuelve a pedirlo', async () => {
    const plugin = { checkPermissions: vi.fn(async () => ({ location: 'granted' })), requestPermissions: vi.fn() }
    const { verificarPermiso } = await cargar({ nativa: true, plugin })
    await expect(verificarPermiso()).resolves.toBeUndefined()
    expect(plugin.requestPermissions).not.toHaveBeenCalled()
  })

  it('falta el permiso: lo pide y, si el usuario acepta, sigue', async () => {
    const plugin = {
      checkPermissions: vi.fn(async () => ({ location: 'prompt' })),
      requestPermissions: vi.fn(async () => ({ location: 'granted' })),
    }
    const { verificarPermiso } = await cargar({ nativa: true, plugin })
    await expect(verificarPermiso()).resolves.toBeUndefined()
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
  })

  it('el usuario lo niega: lanza permiso_denegado con la ruta de Ajustes', async () => {
    const plugin = {
      checkPermissions: vi.fn(async () => ({ location: 'denied', coarseLocation: 'denied' })),
      requestPermissions: vi.fn(async () => ({ location: 'denied', coarseLocation: 'denied' })),
    }
    const { verificarPermiso } = await cargar({ nativa: true, plugin })
    await expect(verificarPermiso()).rejects.toMatchObject({ codigo: 'permiso_denegado', mensaje: expect.stringMatching(/Ajustes/) })
  })
})
