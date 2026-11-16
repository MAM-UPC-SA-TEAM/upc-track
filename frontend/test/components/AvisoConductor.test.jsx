// El aviso del conductor distingue lo informativo (verde suave) de un retraso o cambio de ruta sin depender solo del color. (Issue U17)
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AvisoConductor from '../../src/components/inicio/AvisoConductor'

const aviso = (tipo, mensaje) => ({ tipo, mensaje, fecha_hora: new Date().toISOString() })

describe('AvisoConductor', () => {
  it('un aviso informativo es verde suave y se rotula «Información»', () => {
    render(<AvisoConductor aviso={aviso('informacion', 'Inicié el recorrido')} />)
    const caja = screen.getByRole('complementary', { name: 'Aviso del conductor' })
    expect(caja).toHaveClass('aviso', 'aviso--informacion')
    expect(caja).not.toHaveClass('aviso--retraso')
    expect(screen.getByText('Información')).toBeInTheDocument()
  })

  it.each([
    ['retraso', 'Retraso'],
    ['cambio_ruta', 'Cambio de ruta'],
  ])('un %s lleva su rótulo y la variante de alerta', (tipo, rotulo) => {
    render(<AvisoConductor aviso={aviso(tipo, 'Tráfico')} />)
    expect(screen.getByRole('complementary', { name: 'Aviso del conductor' })).toHaveClass(`aviso--${tipo}`)
    expect(screen.getByText(rotulo)).toBeInTheDocument()
    expect(screen.getByText('Tráfico')).toBeInTheDocument()
  })

  it('sin aviso no pinta nada', () => {
    const { container } = render(<AvisoConductor aviso={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
