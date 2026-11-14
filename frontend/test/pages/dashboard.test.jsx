// Pruebas funcionales de la pantalla de inicio del estudiante («¿cuándo llega mi bus?»).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)
vi.mock('../../src/pages/MapaTiempoReal', () => ({ default: () => <h1>Mapa en tiempo real</h1> }))

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

const hace = (min) => new Date(Date.now() - min * 60_000).toISOString()
const bus = (extra = {}) => ({
  id_bus: 1, nombre: 'Bus 1', nombre_ruta: 'Centro - UPC', id_ruta: 1, estado: 'en_recorrido', lat: 8.311, lng: -73.615, edad_segundos: 3, ...extra,
})
const paradas = {
  paradas: [
    { id_parada: 1, nombre: 'Parque Principal', lat: 8.31, lng: -73.617, orden: 1 },
    { id_parada: 2, nombre: 'UPC Seccional', lat: 8.318, lng: -73.605, orden: 2 },
  ],
}

function montar({ buses = [bus()], notificaciones = [], conParadas = true } = {}) {
  backend.respuestas['GET /api/buses/activos'] = { buses }
  backend.respuestas['GET /api/rutas'] = { rutas: [{ id_ruta: 1, nombre: 'Centro - UPC', activa: 1 }] }
  backend.respuestas['GET /api/paradas?ruta_id=1'] = conParadas ? paradas : { paradas: [] }
  backend.respuestas['GET /api/notificaciones'] = { notificaciones }
  return abrirApp('/inicio', estudiante)
}

const seccionEta = async () => within(await screen.findByRole('region', { name: 'Llegada de tu bus' }))

describe('Inicio del estudiante', () => {
  it('con un bus en recorrido muestra la llegada estimada, el bus y el dato validado', async () => {
    montar()
    await (await seccionEta()).findByText(/Validado · \d+ s/)
    const eta = await seccionEta()
    expect(eta.getByText('Centro - UPC')).toBeInTheDocument()
    expect(eta.getByText(/Bus 1 · a [\d,.]+ km/)).toBeInTheDocument()
    expect(eta.getByRole('status')).toHaveTextContent(/Tu bus llega a Parque Principal en \d+ minutos\. Dato validado\./)
    expect(eta.getByText('Tiempo estimado por distancia en línea recta.')).toBeInTheDocument()
  })

  it('«Ver en el mapa» lleva al mapa en tiempo real', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(await screen.findByRole('button', { name: /ver en el mapa/i }))
    expect(await screen.findByRole('heading', { name: 'Mapa en tiempo real' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/mapa')
  })

  it('sin buses transmitiendo lo dice y ofrece ver rutas y horarios', async () => {
    const user = userEvent.setup()
    montar({ buses: [] })
    expect((await screen.findAllByText(/Ningún bus está transmitiendo ahora\. Revisa los horarios/)).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /ver rutas y horarios/i }))
    expect(window.location.pathname).toBe('/rutas')
  })

  it('un bus detenido no cuenta para la llegada', async () => {
    montar({ buses: [bus({ estado: 'detenido' })] })
    expect((await screen.findAllByText(/Ningún bus está transmitiendo ahora/)).length).toBeGreaterThan(0)
  })

  it('un dato de más de 30 s se anula con el sello «Sin señal»', async () => {
    montar({ buses: [bus({ edad_segundos: 120 })] })
    expect(await (await seccionEta()).findByText('Hace 2 min')).toBeInTheDocument()
    expect((await seccionEta()).getByText('Sin señal')).toBeInTheDocument()
    expect((await seccionEta()).getByRole('status')).toHaveTextContent('Dato anulado: Sin señal.')
  })

  it('si el servidor falla y no hay datos muestra «Sin conexión» con reintento', async () => {
    const user = userEvent.setup()
    backend.respuestas['GET /api/buses/activos'] = rechazo(500, 'caído')
    abrirApp('/inicio', estudiante)
    expect((await screen.findAllByText(/Sin conexión\. No sabemos dónde está tu bus/)).length).toBeGreaterThan(0)

    backend.respuestas['GET /api/buses/activos'] = { buses: [bus()] }
    backend.respuestas['GET /api/rutas'] = { rutas: [{ id_ruta: 1, nombre: 'Centro - UPC', activa: 1 }] }
    backend.respuestas['GET /api/paradas?ruta_id=1'] = paradas
    await user.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(await (await seccionEta()).findByText(/Validado/)).toBeInTheDocument()
  })

  it('el estudiante elige su parada y la elección se recuerda en el dispositivo', async () => {
    const user = userEvent.setup()
    montar()
    const selector = await screen.findByRole('combobox', { name: 'Tu parada' })
    expect(within(selector).getAllByRole('option').map((o) => o.textContent)).toEqual(['Parque Principal', 'UPC Seccional'])
    await user.selectOptions(selector, '2')
    expect(localStorage.getItem('upctrack.miParada')).toBe('2')
    expect(await (await seccionEta()).findByText(/Tu bus llega a UPC Seccional/)).toBeInTheDocument()
  })

  it('muestra el último aviso del conductor si es reciente', async () => {
    montar({ notificaciones: [{ id_notificacion: 1, tipo: 'retraso', mensaje: 'Tráfico en la avenida', fecha_hora: hace(10) }] })
    const aviso = await screen.findByRole('complementary', { name: 'Aviso del conductor' })
    expect(within(aviso).getByText('Tráfico en la avenida')).toBeInTheDocument()
    expect(within(aviso).getByText('hace 10 min')).toBeInTheDocument()
  })

  it('un aviso de hace más de 90 minutos no se muestra', async () => {
    montar({ notificaciones: [{ id_notificacion: 1, tipo: 'info', mensaje: 'Aviso viejo', fecha_hora: hace(200) }] })
    await (await seccionEta()).findByText(/Validado/)
    expect(screen.queryByText('Aviso viejo')).toBeNull()
  })

  it('un aviso nuevo por socket aparece sin recargar', async () => {
    montar()
    await (await seccionEta()).findByText(/Validado/)
    expect(screen.queryByRole('complementary', { name: 'Aviso del conductor' })).toBeNull()
    act(() => socketFalso.desdeServidor('notificacion:nueva', {
      id_notificacion: 7, tipo: 'cambio_ruta', mensaje: 'Desvío por obras', fecha_hora: new Date().toISOString(),
    }))
    expect(await screen.findByRole('complementary', { name: 'Aviso del conductor' })).toHaveTextContent('Desvío por obras')
  })

  it('un cambio de estado por socket vuelve a consultar los buses', async () => {
    montar()
    await (await seccionEta()).findByText(/Validado/)
    const antes = backend.llamadasA('GET', '/api/buses/activos').length
    backend.respuestas['GET /api/buses/activos'] = { buses: [] }
    act(() => socketFalso.desdeServidor('bus:estado', { id_bus: 1, estado: 'fuera_de_servicio' }))
    expect((await screen.findAllByText(/Ningún bus está transmitiendo ahora/)).length).toBeGreaterThan(0)
    expect(backend.llamadasA('GET', '/api/buses/activos').length).toBeGreaterThan(antes)
  })

  it('ofrece los enlaces a rutas y buses', async () => {
    montar()
    const nav = await screen.findByRole('navigation', { name: 'Más' })
    expect(within(nav).getByRole('link', { name: 'Ver rutas' })).toHaveAttribute('href', '/rutas')
    expect(within(nav).getByRole('link', { name: 'Ver buses' })).toHaveAttribute('href', '/buses')
  })

  it('con paradas muestra el mapa esquemático que abre el mapa en tiempo real', async () => {
    montar()
    expect(await screen.findByRole('link', { name: 'Abrir el mapa en tiempo real' })).toHaveAttribute('href', '/mapa')
  })
})
