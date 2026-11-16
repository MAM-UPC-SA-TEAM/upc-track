// Pruebas funcionales de la pantalla «Rutas disponibles» (app completa, backend falso).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

const rutas = {
  rutas: [
    { id_ruta: 1, nombre: 'Ruta Centro', activa: 1, num_paradas: 3 },
    { id_ruta: 2, nombre: 'Ruta Norte', activa: 0, num_paradas: 1 },
  ],
}
const horarios = {
  horarios: [
    { id_horario: 11, id_ruta: 1, hora_salida: '14:00:00', hora_llegada: '14:45:00' },
    { id_horario: 10, id_ruta: 1, hora_salida: '06:30:00', hora_llegada: '07:15:00' },
    { id_horario: 12, id_ruta: 1, hora_salida: '19:00:00', hora_llegada: '19:40:00' },
  ],
}

const tarjeta = (nombre) => screen.getByRole('heading', { name: nombre, level: 2 }).closest('article')

describe('Rutas disponibles', () => {
  it('muestra cada ruta con su estado y su número de paradas', async () => {
    backend.respuestas['GET /api/rutas'] = rutas
    backend.respuestas['GET /api/horarios'] = horarios
    abrirApp('/rutas', estudiante)

    await screen.findByRole('heading', { name: 'Ruta Centro', level: 2 })
    expect(within(tarjeta('Ruta Centro')).getByText('Activa')).toBeInTheDocument()
    expect(within(tarjeta('Ruta Centro')).getByText('3 paradas')).toBeInTheDocument()
    expect(within(tarjeta('Ruta Norte')).getByText('Suspendida')).toBeInTheDocument()
    expect(within(tarjeta('Ruta Norte')).getByText('1 parada')).toBeInTheDocument()
  })

  it('lista los horarios ordenados, con su turno y sin los segundos', async () => {
    backend.respuestas['GET /api/rutas'] = rutas
    backend.respuestas['GET /api/horarios'] = horarios
    abrirApp('/rutas', estudiante)

    await screen.findByRole('heading', { name: 'Ruta Centro', level: 2 })
    const filas = within(tarjeta('Ruta Centro')).getAllByRole('listitem').map((li) => li.textContent)
    expect(filas).toEqual(['Mañana06:30 – 07:15', 'Tarde14:00 – 14:45', 'Noche19:00 – 19:40'])
  })

  it('una ruta sin horarios lo dice', async () => {
    backend.respuestas['GET /api/rutas'] = rutas
    backend.respuestas['GET /api/horarios'] = horarios
    abrirApp('/rutas', estudiante)
    await screen.findByRole('heading', { name: 'Ruta Norte', level: 2 })
    expect(within(tarjeta('Ruta Norte')).getByText('Sin horarios cargados.')).toBeInTheDocument()
  })

  it('una ruta activa enlaza al mapa; una suspendida avisa y no enlaza', async () => {
    backend.respuestas['GET /api/rutas'] = rutas
    backend.respuestas['GET /api/horarios'] = horarios
    abrirApp('/rutas', estudiante)
    await screen.findByRole('heading', { name: 'Ruta Centro', level: 2 })

    expect(within(tarjeta('Ruta Centro')).getByRole('link', { name: /ver en el mapa/i })).toHaveAttribute('href', '/mapa?ruta=1')
    expect(within(tarjeta('Ruta Norte')).queryByRole('link')).toBeNull()
    expect(within(tarjeta('Ruta Norte')).getByText(/Ruta suspendida por ahora/)).toBeInTheDocument()
  })

  it('sin rutas muestra el estado vacío', async () => {
    backend.respuestas['GET /api/rutas'] = { rutas: [] }
    backend.respuestas['GET /api/horarios'] = { horarios: [] }
    abrirApp('/rutas', estudiante)
    expect(await screen.findByText('Sin rutas')).toBeInTheDocument()
  })

  it('mientras carga muestra el aviso de búsqueda', () => {
    backend.respuestas['GET /api/rutas'] = () => new Promise(() => {}) // nunca responde
    abrirApp('/rutas', estudiante)
    return screen.findByText('Buscando las rutas…')
  })

  it('un fallo de carga NO se disfraza de «sin rutas» y permite reintentar', async () => {
    const user = userEvent.setup()
    backend.respuestas['GET /api/rutas'] = rechazo(500, 'caído')
    abrirApp('/rutas', estudiante)

    expect(await screen.findByText('No pudimos cargar')).toBeInTheDocument()
    expect(screen.queryByText('Sin rutas')).toBeNull()

    backend.respuestas['GET /api/rutas'] = rutas
    backend.respuestas['GET /api/horarios'] = horarios
    await user.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(await screen.findByRole('heading', { name: 'Ruta Centro', level: 2 })).toBeInTheDocument()
  })
})
