import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { EsqueletoLista, EsqueletoHoja, EsqueletoMapa, EsqueletoCifra, EsqueletoFilas } from '../../src/components/shared/Esqueleto'
import { TEXTO_DESPERTANDO } from '../../src/hooks/useTardando'
import EstadoLista from '../../src/components/listas/EstadoLista'
import TalonETA from '../../src/components/inicio/TalonETA'

afterEach(() => vi.useRealTimers())

describe('Esqueleto', () => {
  it('la lista cargando es decorativa, marca aria-busy y anuncia la etiqueta', () => {
    const { container } = render(<EsqueletoLista filas={4} etiqueta="Buscando buses…" />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(container.querySelectorAll('.esq-fila')).toHaveLength(4)
    expect(container.querySelector('.esq-filas').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByRole('status').textContent).toBe('Buscando buses…')
  })

  it('tras 6 s cambia al aviso «Despertando el servidor…»', () => {
    vi.useFakeTimers()
    render(<EsqueletoLista />)
    expect(screen.queryByText(TEXTO_DESPERTANDO, { selector: 'p.talon-vacio' })).toBeNull()
    act(() => { vi.advanceTimersByTime(6000) })
    expect(screen.getByRole('status').textContent).toBe(TEXTO_DESPERTANDO)
  })

  it('la hoja, el mapa y la cifra tienen su silueta', () => {
    const { container: hoja } = render(<EsqueletoHoja renglones={3} />)
    expect(hoja.querySelectorAll('.esq-hoja-renglon')).toHaveLength(3)
    const { container: mapa } = render(<EsqueletoMapa />)
    expect(mapa.querySelectorAll('.esq-chip')).toHaveLength(3)
    expect(mapa.querySelector('.esq-mapa-hoja')).not.toBeNull()
    const { container: cifra } = render(<EsqueletoCifra />)
    expect(cifra.querySelector('.esq-cifra').getAttribute('aria-hidden')).toBe('true')
    const { container: filas } = render(<EsqueletoFilas filas={2} />)
    expect(filas.querySelectorAll('.esq-fila')).toHaveLength(2)
  })

  it('EstadoLista usa el esqueleto al cargar y deja de usarlo con el contenido', () => {
    const vacio = { titulo: 'Nada', texto: 'No hay nada' }
    const { container, rerender } = render(<MemoryRouter><EstadoLista fase="cargando" vacio={vacio} /></MemoryRouter>)
    expect(container.querySelector('.esq-filas')).not.toBeNull()
    rerender(<MemoryRouter><EstadoLista fase="vacio" vacio={vacio} /></MemoryRouter>)
    expect(container.querySelector('.esq')).toBeNull()
    expect(screen.getByText('Nada')).toBeTruthy()
  })

  it('el talón de ETA pone la cifra esqueleto solo mientras carga', () => {
    const props = { parada: null, paradas: [], onParada() {}, bus: null, edad: null, frescoMax: 30, datoDesde: 0 }
    const { container, rerender } = render(<TalonETA {...props} fase="cargando" />)
    expect(container.querySelector('.esq-cifra')).not.toBeNull()
    rerender(<TalonETA {...props} fase="sin-buses" />)
    expect(container.querySelector('.esq-cifra')).toBeNull()
  })
})
