import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ServidorDespertando from '../../src/components/shared/ServidorDespertando'
import { EVENTO_SERVIDOR } from '../../src/services/api'

const emitir = (activo) =>
  act(() => { window.dispatchEvent(new CustomEvent(EVENTO_SERVIDOR, { detail: { activo } })) })

describe('<ServidorDespertando />', () => {
  it('no muestra nada mientras el servidor responde', () => {
    render(<ServidorDespertando />)
    expect(screen.queryByRole('status')).toBeNull()
  })
  it('muestra el aviso al despertar y lo quita al responder', () => {
    render(<ServidorDespertando />)
    emitir(true)
    expect(screen.getByRole('status')).toHaveTextContent(/Despertando el servidor/)
    emitir(false)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
