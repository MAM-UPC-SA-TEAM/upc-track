// Splash de arranque (U35): una vez por arranque, dura lo que el bus tarda, cede al aviso del servidor dormido,
// y con «reducir movimiento» no hay animación ni fundido.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Splash from '../../src/components/shared/Splash'
import {
  debeMostrarSplash, reiniciarSplash, DURACION_MIN_MS, DURACION_MIN_REDUCIDA_MS, DURACION_SALIDA_MS,
} from '../../src/utils/splash'
import { EVENTO_SERVIDOR } from '../../src/services/api'

function entorno({ reducido = false, standalone = false } = {}) {
  window.matchMedia = vi.fn((query) => ({
    matches: query.includes('prefers-reduced-motion') ? reducido : query.includes('display-mode') ? standalone : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}
const irA = (ruta) => window.history.pushState({}, '', ruta)
const avanzar = (ms) => act(() => { vi.advanceTimersByTime(ms) })
const servidor = (activo) => act(() => { window.dispatchEvent(new CustomEvent(EVENTO_SERVIDOR, { detail: { activo } })) })

beforeEach(() => {
  vi.useFakeTimers()
  reiniciarSplash()
  entorno()
  irA('/login')
})
afterEach(() => {
  vi.useRealTimers()
  irA('/')
})

describe('debeMostrarSplash', () => {
  it('en el navegador la landing (/) abre directo; las rutas internas, la app nativa y la PWA instalada, con splash', () => {
    expect(debeMostrarSplash({ ruta: '/', nativa: false, standalone: false })).toBe(false)
    expect(debeMostrarSplash({ ruta: '/login', nativa: false, standalone: false })).toBe(true)
    expect(debeMostrarSplash({ ruta: '/', nativa: true, standalone: false })).toBe(true)
    expect(debeMostrarSplash({ ruta: '/', nativa: false, standalone: true })).toBe(true)
  })
})

describe('<Splash />', () => {
  it('se muestra al arrancar, anunciado como «Cargando UpcTrack», y cubre la interfaz', () => {
    render(<Splash />)
    const splash = screen.getByRole('status', { name: 'Cargando UpcTrack' })
    expect(splash).toHaveAttribute('data-fase', 'visible')
    expect(splash.querySelector('.splash-bus')).not.toBeNull() // el bus que recorre la ruta
    expect(splash.querySelector('.splash-parada')).not.toBeNull()
  })

  it('dura lo que el bus tarda en llegar, se desvanece y se retira', () => {
    render(<Splash />)
    avanzar(DURACION_MIN_MS - 1)
    expect(screen.getByRole('status')).toHaveAttribute('data-fase', 'visible')

    avanzar(1)
    expect(screen.getByRole('status')).toHaveAttribute('data-fase', 'saliendo') // fundido de salida

    avanzar(DURACION_SALIDA_MS)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('no se repite en el mismo arranque: un segundo montaje ya no lo muestra', () => {
    const { unmount } = render(<Splash />)
    avanzar(DURACION_MIN_MS + DURACION_SALIDA_MS)
    expect(screen.queryByRole('status')).toBeNull()
    unmount()

    render(<Splash />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('en la landing del navegador no aparece', () => {
    irA('/')
    render(<Splash />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('si el servidor está despertando se retira de inmediato para que el aviso «Despertando el servidor» tome el relevo', () => {
    render(<Splash />)
    avanzar(300) // aún no cumple su tiempo mínimo
    servidor(true)
    expect(screen.getByRole('status')).toHaveAttribute('data-fase', 'saliendo')
    avanzar(DURACION_SALIDA_MS)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('el fin del aviso del servidor («activo: false») no lo retira antes de tiempo', () => {
    render(<Splash />)
    servidor(false)
    expect(screen.getByRole('status')).toHaveAttribute('data-fase', 'visible')
  })

  it('con «reducir movimiento» dura menos y se retira en el acto, sin fundido', () => {
    entorno({ reducido: true })
    render(<Splash />)
    avanzar(DURACION_MIN_REDUCIDA_MS - 1)
    expect(screen.getByRole('status')).toHaveAttribute('data-fase', 'visible')
    avanzar(1)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('en la PWA instalada (standalone) aparece aunque la ruta sea /', () => {
    entorno({ standalone: true })
    irA('/')
    render(<Splash />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('al desmontarse a medio camino no deja temporizadores que lo marquen como mostrado', () => {
    const { unmount } = render(<Splash />)
    avanzar(200)
    unmount()
    avanzar(5000)
    render(<Splash />)
    expect(screen.getByRole('status')).toBeInTheDocument() // no llegó a completarse: sigue sin contar como mostrado
  })
})
