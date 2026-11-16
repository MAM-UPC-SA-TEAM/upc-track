// Entradas y salidas del diálogo del admin y de los paneles de la barra (U29).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import DialogoForm from '../../src/components/admin/DialogoForm'
import PanelDesplegable from '../../src/components/shared/PanelDesplegable'
import { DURACION_SALIDA_MS } from '../../src/utils/movimiento'

const conMovimiento = () => {
  window.matchMedia = vi.fn((q) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}
beforeEach(() => { vi.useFakeTimers(); conMovimiento() })
afterEach(() => vi.useRealTimers())

describe('DialogoForm: salida animada', () => {
  const hijos = <div className="dialogo-cuerpo"><label>Nombre<input defaultValue="Ana" /></label></div>

  it('al cerrar, sigue visible con su contenido (data-saliendo) hasta que acaba la salida', () => {
    const { rerender } = render(<DialogoForm abierto titulo="Editar usuario" onCerrar={() => {}}>{hijos}</DialogoForm>)
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-saliendo')

    // La página ya vació su formulario y su título al cerrar: lo que se ve en la salida es lo último que tuvo abierto
    rerender(<DialogoForm abierto={false} titulo="" onCerrar={() => {}}>{null}</DialogoForm>)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-saliendo')
    expect(screen.getByRole('heading', { name: 'Editar usuario' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana')

    act(() => { vi.advanceTimersByTime(DURACION_SALIDA_MS + 5) })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('durante la salida un toque en el fondo no hace nada', () => {
    const onCerrar = vi.fn()
    const { rerender } = render(<DialogoForm abierto titulo="X" onCerrar={onCerrar}>{hijos}</DialogoForm>)
    rerender(<DialogoForm abierto={false} titulo="X" onCerrar={onCerrar}>{hijos}</DialogoForm>)
    onCerrar.mockClear()
    screen.getByRole('dialog').click()
    expect(onCerrar).not.toHaveBeenCalled()
  })

  it('si se vuelve a abrir durante la salida, el diálogo sigue abierto', () => {
    const { rerender } = render(<DialogoForm abierto titulo="X" onCerrar={() => {}}>{hijos}</DialogoForm>)
    rerender(<DialogoForm abierto={false} titulo="X" onCerrar={() => {}}>{hijos}</DialogoForm>)
    act(() => { vi.advanceTimersByTime(60) })
    rerender(<DialogoForm abierto titulo="X" onCerrar={() => {}}>{hijos}</DialogoForm>)
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-saliendo')
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })
})

describe('PanelDesplegable', () => {
  const ancla = () => {
    const d = document.createElement('div')
    d.append(document.createElement('button'))
    document.body.append(d)
    return { current: d }
  }

  it('en la salida queda oculto a lectores de pantalla y se quita al terminar', () => {
    const anclaRef = ancla()
    const { rerender } = render(<PanelDesplegable abierto anclaRef={anclaRef} className="topbar-panel--perfil"><p>Menú</p></PanelDesplegable>)
    expect(screen.getByText('Menú').parentElement).toHaveClass('topbar-panel', 'topbar-panel--perfil')
    expect(screen.getByText('Menú').parentElement).not.toHaveAttribute('aria-hidden')

    rerender(<PanelDesplegable abierto={false} anclaRef={anclaRef}><p>Menú</p></PanelDesplegable>)
    expect(screen.getByText('Menú').parentElement).toHaveClass('topbar-panel--sale')
    expect(screen.getByText('Menú').parentElement).toHaveAttribute('aria-hidden', 'true')

    act(() => { vi.advanceTimersByTime(DURACION_SALIDA_MS + 5) })
    expect(screen.queryByText('Menú')).toBeNull()
  })

  it('el origen de la animación sale de la posición del botón, no de una esquina fija', () => {
    // jsdom no hace layout: se simula el padre posicionado y la posición del botón (centro a 300 px, panel desde 100 px)
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get: () => ({ getBoundingClientRect: () => ({ left: 0 }) }) })
    Object.defineProperty(HTMLElement.prototype, 'offsetLeft', { configurable: true, get: () => 100 })
    const anclaRef = ancla()
    anclaRef.current.querySelector('button').getBoundingClientRect = () => ({ left: 280, width: 40 })
    try {
      render(<PanelDesplegable abierto anclaRef={anclaRef}><p>Menú</p></PanelDesplegable>)
      expect(screen.getByText('Menú').parentElement.style.transformOrigin).toBe('200px 0px')
    } finally {
      if (original) Object.defineProperty(HTMLElement.prototype, 'offsetParent', original); else delete HTMLElement.prototype.offsetParent
      delete HTMLElement.prototype.offsetLeft
    }
  })
})
