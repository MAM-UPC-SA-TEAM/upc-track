import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const m = vi.hoisted(() => ({ enLinea: true }))
vi.mock('../../src/hooks/useCicloVida', () => ({ useEnLinea: () => m.enLinea }))

const { usePWA } = await import('../../src/hooks/usePWA')

function simularStandalone(activo) {
  window.matchMedia = vi.fn(() => ({ matches: activo }))
}

function eventoInstalacion(outcome = 'accepted') {
  const e = new Event('beforeinstallprompt', { cancelable: true })
  e.prompt = vi.fn()
  e.userChoice = Promise.resolve({ outcome })
  return e
}

beforeEach(() => {
  m.enLinea = true
  simularStandalone(false)
})

describe('usePWA', () => {
  it('estado inicial: no se puede instalar y hay conexión', () => {
    const { result } = renderHook(() => usePWA())
    expect(result.current.puedeInstalar).toBe(false)
    expect(result.current.estaOffline).toBe(false)
    expect(result.current.actualizacionDisponible).toBe(false)
  })

  it('estaOffline es lo contrario de estar en línea', () => {
    m.enLinea = false
    const { result } = renderHook(() => usePWA())
    expect(result.current.estaOffline).toBe(true)
  })

  it('captura beforeinstallprompt, evita el aviso automático y permite instalar', () => {
    const { result } = renderHook(() => usePWA())
    const e = eventoInstalacion()
    act(() => { window.dispatchEvent(e) })
    expect(e.defaultPrevented).toBe(true)
    expect(result.current.puedeInstalar).toBe(true)
  })

  it('instalar aceptado muestra el aviso, devuelve true y oculta la opción', async () => {
    const { result } = renderHook(() => usePWA())
    const e = eventoInstalacion('accepted')
    act(() => { window.dispatchEvent(e) })
    let aceptado
    await act(async () => { aceptado = await result.current.instalar() })
    expect(e.prompt).toHaveBeenCalled()
    expect(aceptado).toBe(true)
    expect(result.current.puedeInstalar).toBe(false)
  })

  it('instalar rechazado devuelve false y mantiene la opción', async () => {
    const { result } = renderHook(() => usePWA())
    act(() => { window.dispatchEvent(eventoInstalacion('dismissed')) })
    let aceptado
    await act(async () => { aceptado = await result.current.instalar() })
    expect(aceptado).toBe(false)
    expect(result.current.puedeInstalar).toBe(true)
  })

  it('instalar sin evento capturado devuelve false', async () => {
    const { result } = renderHook(() => usePWA())
    let aceptado
    await act(async () => { aceptado = await result.current.instalar() })
    expect(aceptado).toBe(false)
  })

  it('si la app ya está instalada (standalone) ignora el evento', () => {
    simularStandalone(true)
    const { result } = renderHook(() => usePWA())
    act(() => { window.dispatchEvent(eventoInstalacion()) })
    expect(result.current.puedeInstalar).toBe(false)
  })

  it('un cambio de service worker marca actualización disponible', () => {
    const escuchas = {}
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { addEventListener: (ev, cb) => { escuchas[ev] = cb } },
    })
    const { result } = renderHook(() => usePWA())
    act(() => escuchas.controllerchange())
    expect(result.current.actualizacionDisponible).toBe(true)
  })

  it('aplicarActualizacion recarga la página', () => {
    const recargar = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: recargar })
    const { result } = renderHook(() => usePWA())
    result.current.aplicarActualizacion()
    expect(recargar).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
