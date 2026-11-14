import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const m = vi.hoisted(() => ({
  reanudar: null,
  quitarReanudar: vi.fn(),
  atras: null,
  quitarAtras: vi.fn(),
  oyentesRed: new Set(),
  enLinea: true,
}))
vi.mock('../../src/services/cicloVida', () => ({
  alReanudar: (cb) => { m.reanudar = cb; return m.quitarReanudar },
  alAtras: (cb) => { m.atras = cb; return m.quitarAtras },
}))
vi.mock('../../src/services/red', () => ({
  alCambiarRed: (cb) => { m.oyentesRed.add(cb); return () => m.oyentesRed.delete(cb) },
  hayRed: () => m.enLinea,
}))

const { useEnLinea, useAlReanudar, useCerrarConAtras } = await import('../../src/hooks/useCicloVida')

beforeEach(() => {
  m.reanudar = null
  m.atras = null
  m.quitarReanudar.mockClear()
  m.quitarAtras.mockClear()
  m.oyentesRed.clear()
  m.enLinea = true
})

describe('useEnLinea', () => {
  it('refleja el estado de la red y se actualiza al cambiar', () => {
    const { result } = renderHook(() => useEnLinea())
    expect(result.current).toBe(true)
    act(() => { m.enLinea = false; m.oyentesRed.forEach((cb) => cb()) })
    expect(result.current).toBe(false)
  })
})

describe('useAlReanudar', () => {
  it('llama al callback solo si estuvo fuera al menos minMs (15 s por defecto)', () => {
    const cb = vi.fn()
    renderHook(() => useAlReanudar(cb))
    m.reanudar(5_000)
    expect(cb).not.toHaveBeenCalled()
    m.reanudar(20_000)
    expect(cb).toHaveBeenCalledWith(20_000)
  })

  it('respeta un minMs propio', () => {
    const cb = vi.fn()
    renderHook(() => useAlReanudar(cb, 1_000))
    m.reanudar(1_500)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('usa siempre la versión más reciente del callback', () => {
    const viejo = vi.fn()
    const nuevo = vi.fn()
    const { rerender } = renderHook(({ cb }) => useAlReanudar(cb), { initialProps: { cb: viejo } })
    rerender({ cb: nuevo })
    m.reanudar(60_000)
    expect(viejo).not.toHaveBeenCalled()
    expect(nuevo).toHaveBeenCalled()
  })

  it('se desuscribe al desmontar', () => {
    const { unmount } = renderHook(() => useAlReanudar(vi.fn()))
    unmount()
    expect(m.quitarReanudar).toHaveBeenCalled()
  })
})

describe('useCerrarConAtras', () => {
  it('inactivo no registra el botón atrás', () => {
    renderHook(() => useCerrarConAtras(false, vi.fn()))
    expect(m.atras).toBeNull()
  })

  it('activo, atrás llama a cerrar y declara que lo atendió', () => {
    const cerrar = vi.fn()
    renderHook(() => useCerrarConAtras(true, cerrar))
    expect(m.atras()).toBe(true)
    expect(cerrar).toHaveBeenCalledTimes(1)
  })

  it('al desactivarse o desmontar libera el botón atrás', () => {
    const { rerender, unmount } = renderHook(({ activo }) => useCerrarConAtras(activo, vi.fn()), { initialProps: { activo: true } })
    rerender({ activo: false })
    expect(m.quitarAtras).toHaveBeenCalledTimes(1)
    unmount()
  })
})
