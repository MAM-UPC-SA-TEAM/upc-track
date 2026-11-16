// Salidas animadas (U29): un elemento sigue montado mientras dura su animación de salida.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { usePresencia } from '../../src/hooks/usePresencia'

function Prueba({ abierto, ms = 140 }) {
  const { montado, saliendo } = usePresencia(abierto, ms)
  return montado ? <p>{saliendo ? 'saliendo' : 'visible'}</p> : null
}

const conMovimiento = () => {
  window.matchMedia = vi.fn((q) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}
const sinMovimiento = () => {
  window.matchMedia = vi.fn((q) => ({ matches: q.includes('prefers-reduced-motion'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('usePresencia', () => {
  it('abierto: se ve; cerrado: sigue montado «saliendo» y se quita al terminar la salida', () => {
    conMovimiento()
    const { rerender } = render(<Prueba abierto />)
    expect(screen.getByText('visible')).toBeInTheDocument()

    rerender(<Prueba abierto={false} />)
    expect(screen.getByText('saliendo')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(139) })
    expect(screen.getByText('saliendo')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2) })
    expect(screen.queryByText(/visible|saliendo/)).toBeNull()
  })

  it('si se vuelve a abrir a mitad de la salida, no se desmonta', () => {
    conMovimiento()
    const { rerender } = render(<Prueba abierto />)
    rerender(<Prueba abierto={false} />)
    act(() => { vi.advanceTimersByTime(70) })
    rerender(<Prueba abierto />)
    act(() => { vi.advanceTimersByTime(500) })
    expect(screen.getByText('visible')).toBeInTheDocument()
  })

  it('nace cerrado y sin salida: no pinta nada', () => {
    conMovimiento()
    render(<Prueba abierto={false} />)
    expect(screen.queryByText(/visible|saliendo/)).toBeNull()
  })

  it('con «reducir movimiento» no hay salida: se quita en el acto', () => {
    sinMovimiento()
    const { rerender } = render(<Prueba abierto />)
    rerender(<Prueba abierto={false} />)
    expect(screen.queryByText(/visible|saliendo/)).toBeNull()
  })
})
