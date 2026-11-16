// El marcador del bus se desliza entre posiciones en vez de saltar (U30). Leaflet se simula: se mide lo que el
// componente le pide al marcador (setLatLng) a lo largo del tiempo.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import L from 'leaflet'

const mundo = vi.hoisted(() => ({ marcador: null, mapa: null }))

vi.mock('react-leaflet', async () => {
  const React = await import('react')
  return {
    useMap: () => mundo.mapa,
    Marker: React.forwardRef(function MarkerFalso({ position }, ref) {
      if (!mundo.marcador) {
        const estado = { lat: position[0], lng: position[1] }
        mundo.marcador = {
          estado,
          colocaciones: [],
          getLatLng: () => L.latLng(estado.lat, estado.lng),
          setLatLng: (p) => { estado.lat = p[0]; estado.lng = p[1]; mundo.marcador.colocaciones.push([...p]) },
        }
      }
      React.useImperativeHandle(ref, () => mundo.marcador)
      return null
    }),
  }
})

import MarcadorSuave from '../../src/components/mapa/MarcadorSuave'

const M_POR_GRADO = 111_195
const norte = (lat0, metros) => lat0 + metros / M_POR_GRADO
const LAT0 = 8.3
const LNG = -73.6

function mapaFalso() {
  const oyentes = {}
  return {
    oyentes,
    on: (ev, f) => { oyentes[ev] = f },
    off: (ev) => { delete oyentes[ev] },
  }
}
const conMovimiento = () => { window.matchMedia = vi.fn((q) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() })) }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
  mundo.marcador = null
  mundo.mapa = mapaFalso()
  conMovimiento()
})
afterEach(() => vi.useRealTimers())

const lat = () => mundo.marcador.estado.lat
const avanzar = (ms) => act(() => { vi.advanceTimersByTime(ms) })

describe('MarcadorSuave', () => {
  it('con una posición nueva se desliza hasta ella en lugar de saltar', () => {
    const { rerender } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000) // pasó el intervalo habitual entre posiciones
    rerender(<MarcadorSuave position={[norte(LAT0, 28), LNG]} />)

    avanzar(2000) // a la mitad del trayecto
    expect(lat()).toBeGreaterThan(norte(LAT0, 10))
    expect(lat()).toBeLessThan(norte(LAT0, 18)) // ~14 m de 28: no ha saltado al final
    avanzar(2100)
    expect(lat()).toBeCloseTo(norte(LAT0, 28), 8) // y llega exactamente al destino
  })

  it('el movimiento es lineal (sin acelerar ni frenar)', () => {
    const { rerender } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000)
    rerender(<MarcadorSuave position={[norte(LAT0, 40), LNG]} />)
    const puntos = []
    for (let i = 0; i < 4; i++) { avanzar(1000); puntos.push(lat() - LAT0) }
    const pasos = puntos.map((p, i) => p - (puntos[i - 1] ?? 0))
    for (const p of pasos) expect(p).toBeCloseTo(pasos[0], 5) // tolerancia de un fotograma (16 ms)
  })

  it('un salto grande (más de 400 m) se coloca de una vez, sin animar', () => {
    const { rerender } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000)
    mundo.marcador.colocaciones.length = 0
    rerender(<MarcadorSuave position={[norte(LAT0, 900), LNG]} />)
    expect(lat()).toBeCloseTo(norte(LAT0, 900), 8)
    expect(mundo.marcador.colocaciones).toHaveLength(1)
  })

  it('si llega otra posición a mitad de camino, sigue desde donde se ve (sin retroceder)', () => {
    const { rerender } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000)
    rerender(<MarcadorSuave position={[norte(LAT0, 28), LNG]} />)
    avanzar(2000)
    const aMitad = lat()
    avanzar(0)
    rerender(<MarcadorSuave position={[norte(LAT0, 56), LNG]} />)
    avanzar(100)
    expect(lat()).toBeGreaterThanOrEqual(aMitad) // no vuelve al principio ni al punto anterior
    avanzar(4100)
    expect(lat()).toBeCloseTo(norte(LAT0, 56), 8)
  })

  it('con «reducir movimiento» el marcador salta de una vez', () => {
    window.matchMedia = vi.fn((q) => ({ matches: q.includes('prefers-reduced-motion'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const { rerender } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000)
    rerender(<MarcadorSuave position={[norte(LAT0, 28), LNG]} />)
    expect(lat()).toBeCloseTo(norte(LAT0, 28), 8)
  })

  it('durante el zoom del mapa no se mueve; al terminar se coloca en su destino', () => {
    const { rerender } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000)
    rerender(<MarcadorSuave position={[norte(LAT0, 28), LNG]} />)
    avanzar(1000)
    act(() => mundo.mapa.oyentes.zoomstart())
    const congelado = lat()
    avanzar(2000)
    expect(lat()).toBe(congelado)
    act(() => mundo.mapa.oyentes.zoomend())
    expect(lat()).toBeCloseTo(norte(LAT0, 28), 8)
  })

  it('una posición que llega durante el zoom no mueve el marcador hasta que el zoom termina', () => {
    const { rerender } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000)
    act(() => mundo.mapa.oyentes.zoomstart())
    mundo.marcador.colocaciones.length = 0
    rerender(<MarcadorSuave position={[norte(LAT0, 28), LNG]} />)
    avanzar(3000)
    expect(mundo.marcador.colocaciones).toHaveLength(0) // ni un setLatLng con el zoom en curso
    act(() => mundo.mapa.oyentes.zoomend())
    expect(lat()).toBeCloseTo(norte(LAT0, 28), 8)
  })

  it('al desmontarse cancela la animación y suelta los oyentes del mapa', () => {
    const { rerender, unmount } = render(<MarcadorSuave position={[LAT0, LNG]} />)
    avanzar(4000)
    rerender(<MarcadorSuave position={[norte(LAT0, 28), LNG]} />)
    unmount()
    const antes = lat()
    avanzar(5000)
    expect(lat()).toBe(antes)
    expect(mundo.mapa.oyentes.zoomstart).toBeUndefined()
  })
})
