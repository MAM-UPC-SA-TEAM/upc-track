// Pruebas funcionales de «Buses disponibles»: carga, ETA, antigüedad del dato y tiempo real por socket.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

const bus = (extra = {}) => ({
  id_bus: 1, nombre: 'Bus 1', nombre_ruta: 'Ruta Centro', id_ruta: 1,
  estado: 'en_recorrido', lat: 10.47, lng: -73.6, edad_segundos: 5, ...extra,
})
// Parada a ~1,1 km del bus (≈ 3 min a 25 km/h)
const paradas = { paradas: [{ id_parada: 1, id_ruta: 1, lat: 10.47, lng: -73.59, activa: true }] }

function cargar(buses, p = paradas) {
  backend.respuestas['GET /api/buses/activos'] = { buses }
  backend.respuestas['GET /api/paradas'] = p
  return abrirApp('/buses', estudiante)
}

const fila = (nombre) => screen.getByText(nombre).closest('a')

describe('Buses disponibles', () => {
  it('muestra el conteo y cada bus con su ruta y estado vivo', async () => {
    cargar([bus(), bus({ id_bus: 2, nombre: 'Bus 2', nombre_ruta: 'Ruta Norte', id_ruta: 2, estado: 'detenido' })])
    expect(await screen.findByRole('heading', { name: '2 buses en ruta' })).toBeInTheDocument()
    expect(within(fila('Bus 1')).getByText('Ruta Centro')).toBeInTheDocument()
    expect(within(fila('Bus 1')).getByText(/Validado · \d+ s/)).toBeInTheDocument()
    expect(within(fila('Bus 2')).getByText('Detenido')).toBeInTheDocument()
  })

  it('con un solo bus usa el singular', async () => {
    cargar([bus()])
    expect(await screen.findByRole('heading', { name: '1 bus en ruta' })).toBeInTheDocument()
  })

  it('calcula el tiempo a la parada más cercana de SU ruta', async () => {
    cargar([bus()])
    await screen.findByText('Bus 1')
    expect(within(fila('Bus 1')).getByText(/Parada más cercana · 3 min/)).toBeInTheDocument()
  })

  it('no estima con paradas de otra ruta ni con paradas inactivas', async () => {
    cargar([bus()], { paradas: [
      { id_parada: 1, id_ruta: 9, lat: 10.47, lng: -73.59, activa: true },
      { id_parada: 2, id_ruta: 1, lat: 10.47, lng: -73.59, activa: false },
    ] })
    await screen.findByText('Bus 1')
    expect(screen.queryByText(/Parada más cercana/)).toBeNull()
  })

  it('un dato de más de 30 s se marca como viejo y no estima llegada', async () => {
    cargar([bus({ edad_segundos: 120 })])
    await screen.findByText('Bus 1')
    expect(within(fila('Bus 1')).getByText('Hace 2 min')).toBeInTheDocument()
    expect(screen.queryByText(/Parada más cercana/)).toBeNull()
  })

  it('cada fila enlaza al mapa de ese bus', async () => {
    cargar([bus()])
    await screen.findByText('Bus 1')
    expect(fila('Bus 1')).toHaveAttribute('href', '/mapa?bus=1')
  })

  it('sin buses transmitiendo muestra el estado vacío con enlace a las rutas', async () => {
    cargar([])
    expect(await screen.findByText('Sin bus ahora')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver rutas y horarios/i })).toHaveAttribute('href', '/rutas')
  })

  it('un fallo de carga muestra el error y permite reintentar', async () => {
    const user = userEvent.setup()
    backend.respuestas['GET /api/buses/activos'] = rechazo(500, 'caído')
    abrirApp('/buses', estudiante)
    expect(await screen.findByText('No pudimos cargar')).toBeInTheDocument()

    backend.respuestas['GET /api/buses/activos'] = { buses: [bus()] }
    backend.respuestas['GET /api/paradas'] = paradas
    await user.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(await screen.findByText('Bus 1')).toBeInTheDocument()
  })
})

describe('Buses disponibles — tiempo real', () => {
  it('un cambio de estado por socket actualiza la etiqueta', async () => {
    cargar([bus()])
    await screen.findByText('Bus 1')
    act(() => socketFalso.desdeServidor('bus:estado', { id_bus: 1, estado: 'detenido' }))
    expect(within(fila('Bus 1')).getByText('Detenido')).toBeInTheDocument()
  })

  it('un bus que sale de servicio desaparece de la lista', async () => {
    cargar([bus()])
    await screen.findByText('Bus 1')
    act(() => socketFalso.desdeServidor('bus:estado', { id_bus: 1, estado: 'fuera_de_servicio' }))
    expect(await screen.findByText('Sin bus ahora')).toBeInTheDocument()
  })

  it('una posición nueva por socket «revive» un dato viejo', async () => {
    cargar([bus({ edad_segundos: 120 })])
    await screen.findByText('Hace 2 min')
    act(() => socketFalso.desdeServidor('bus:location', { id_bus: 1, lat: 10.47, lng: -73.6 }))
    expect(await screen.findByText(/Validado · \d+ s/)).toBeInTheDocument()
  })

  it('eventos de otro bus no afectan a este', async () => {
    cargar([bus()])
    await screen.findByText('Bus 1')
    act(() => socketFalso.desdeServidor('bus:estado', { id_bus: 99, estado: 'detenido' }))
    expect(within(fila('Bus 1')).getByText(/Validado/)).toBeInTheDocument()
  })
})
