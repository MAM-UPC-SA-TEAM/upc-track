// «Ver bus» abre el mapa en la ruta del bus elegido, no en la primera ruta activa. (Issue U12)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { backend, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)
// Leaflet no corre en jsdom: se simula solo el mapa; la lógica de la página es la real
vi.mock('react-leaflet', () => {
  const Nada = () => null
  return {
    MapContainer: ({ children }) => <div data-testid="mapa">{children}</div>,
    TileLayer: Nada, Marker: Nada, Polyline: Nada, CircleMarker: Nada, Tooltip: Nada,
    ZoomControl: Nada, AttributionControl: Nada,
    useMap: () => ({ fitBounds: vi.fn(), panInside: vi.fn(), setView: vi.fn(), flyTo: vi.fn(), getZoom: () => 15, invalidateSize: vi.fn() }),
    useMapEvents: () => null,
  }
})

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
  backend.respuestas['GET /api/buses/activos'] = {
    buses: [
      { id_bus: 1, nombre: 'Bus 1', id_ruta: 1, nombre_ruta: 'Centro - UPC', estado: 'en_recorrido', lat: 8.31, lng: -73.61, edad_segundos: 2 },
      { id_bus: 2, nombre: 'Bus 2', id_ruta: 2, nombre_ruta: 'Norte - UPC', estado: 'en_recorrido', lat: 8.32, lng: -73.62, edad_segundos: 2 },
    ],
  }
  backend.respuestas['GET /api/rutas'] = {
    rutas: [{ id_ruta: 1, nombre: 'Centro - UPC', activa: 1 }, { id_ruta: 2, nombre: 'Norte - UPC', activa: 1 }],
  }
  backend.respuestas['GET /api/paradas?ruta_id=1'] = { paradas: [{ id_parada: 1, nombre: 'Parque', lat: 8.31, lng: -73.61, orden: 1 }] }
  backend.respuestas['GET /api/paradas?ruta_id=2'] = { paradas: [{ id_parada: 2, nombre: 'Terminal', lat: 8.32, lng: -73.62, orden: 1 }] }
  backend.respuestas['GET /api/notificaciones'] = { notificaciones: [] }
})

const rutasPedidas = () => backend.llamadas.filter(l => l.metodo === 'GET' && l.url.startsWith('/api/paradas?ruta_id=')).map(l => l.url)

describe('Mapa: ?bus=ID', () => {
  it('un bus de la segunda ruta abre la segunda ruta', async () => {
    abrirApp('/mapa?bus=2', estudiante)
    await waitFor(() => expect(rutasPedidas()).toContain('/api/paradas?ruta_id=2'))
    expect(rutasPedidas()).not.toContain('/api/paradas?ruta_id=1')
  })

  it('un bus de la primera ruta abre la primera', async () => {
    abrirApp('/mapa?bus=1', estudiante)
    await waitFor(() => expect(rutasPedidas()).toContain('/api/paradas?ruta_id=1'))
    expect(rutasPedidas()).not.toContain('/api/paradas?ruta_id=2')
  })

  it('un bus que ya no está activo cae en la ruta por defecto, sin error', async () => {
    abrirApp('/mapa?bus=99', estudiante)
    await waitFor(() => expect(rutasPedidas()).toContain('/api/paradas?ruta_id=1'))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('?ruta manda sobre ?bus', async () => {
    abrirApp('/mapa?ruta=1&bus=2', estudiante)
    await waitFor(() => expect(rutasPedidas()).toContain('/api/paradas?ruta_id=1'))
    expect(rutasPedidas()).not.toContain('/api/paradas?ruta_id=2')
  })
})
