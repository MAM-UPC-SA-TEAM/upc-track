// Pruebas funcionales de «Gestión de rutas»: rutas, y las paradas y horarios de la ruta elegida.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, admin } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

const datos = () => {
  backend.respuestas['GET /api/rutas'] = {
    rutas: [
      { id_ruta: 1, nombre: 'Centro - UPC', descripcion: 'Demo', activa: 1, num_paradas: 2 },
      { id_ruta: 2, nombre: 'Norte', descripcion: '', activa: 0, num_paradas: 0 },
    ],
  }
  backend.respuestas['GET /api/paradas?ruta_id=1'] = {
    paradas: [
      { id_parada: 12, nombre: 'UPC Seccional', lat: 8.318, lng: -73.605, orden: 2, activa: true },
      { id_parada: 11, nombre: 'Parque Principal', lat: 8.31, lng: -73.617, orden: 1, activa: true },
    ],
  }
  backend.respuestas['GET /api/horarios?ruta_id=1'] = {
    horarios: [{ id_horario: 5, id_ruta: 1, hora_salida: '06:30:00', hora_llegada: '07:00:00' }],
  }
}
const abrir = () => abrirApp('/admin/rutas', admin)
const tablaRutas = () => within(screen.getByRole('table', { name: 'Rutas' }))
const dialogo = () => within(screen.getByRole('dialog'))

async function elegirRutaCentro(user) {
  await screen.findByRole('heading', { name: '2 rutas' })
  await user.click(tablaRutas().getByRole('button', { name: 'Paradas y horarios de Centro - UPC' }))
  await screen.findByRole('heading', { name: 'Paradas de Centro - UPC' })
}

describe('Gestión de rutas — rutas', () => {
  it('lista las rutas con su número de paradas y estado', async () => {
    datos()
    abrir()
    expect(await screen.findByRole('heading', { name: '2 rutas' })).toBeInTheDocument()
    const centro = within(tablaRutas().getByText('Centro - UPC').closest('tr'))
    expect(centro.getByText('Activa')).toBeInTheDocument()
    expect(centro.getByText('2')).toBeInTheDocument()
    expect(within(tablaRutas().getByText('Norte').closest('tr')).getByText('Suspendida')).toBeInTheDocument()
  })

  it('sin rutas / con fallo de carga muestra el estado correcto', async () => {
    const user = userEvent.setup()
    backend.respuestas['GET /api/rutas'] = rechazo(500, 'caído')
    abrir()
    expect(await screen.findByText('No pudimos cargar')).toBeInTheDocument()
    backend.respuestas['GET /api/rutas'] = { rutas: [] }
    await user.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(await screen.findByText('Sin rutas')).toBeInTheDocument()
  })

  it('crear: el nombre es obligatorio', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar ruta' }))
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    expect(dialogo().getByText('El nombre de la ruta es obligatorio.')).toBeInTheDocument()
    expect(backend.llamadasA('POST', '/api/rutas')).toHaveLength(0)
  })

  it('crea la ruta, cierra el diálogo y recarga', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar ruta' }))
    const cargasAntes = backend.llamadasA('GET', '/api/rutas').length
    await user.type(dialogo().getByLabelText('Nombre de la ruta'), 'Sur')
    await user.type(dialogo().getByLabelText('Descripción'), 'Barrio Sur')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(backend.llamadasA('POST', '/api/rutas')[0].cuerpo).toEqual({ nombre: 'Sur', descripcion: 'Barrio Sur', activa: true })
    await waitFor(() => expect(backend.llamadasA('GET', '/api/rutas').length).toBeGreaterThan(cargasAntes))
  })

  it('un error del servidor al crear se muestra en el diálogo', async () => {
    backend.respuestas['POST /api/rutas'] = rechazo(500, 'Error interno del servidor')
    const user = userEvent.setup()
    datos()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar ruta' }))
    await user.type(dialogo().getByLabelText('Nombre de la ruta'), 'Sur')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    expect(await dialogo().findByRole('alert')).toHaveTextContent('Error interno del servidor')
  })

  it('editar precarga los datos y permite suspender la ruta', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await screen.findByRole('heading', { name: '2 rutas' })
    await user.click(tablaRutas().getByRole('button', { name: 'Editar Centro - UPC' }))
    expect(dialogo().getByLabelText('Nombre de la ruta')).toHaveValue('Centro - UPC')
    await user.selectOptions(dialogo().getByLabelText('Estado'), 'false')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(backend.llamadasA('PATCH', '/api/rutas/1')).toHaveLength(1))
    expect(backend.llamadasA('PATCH', '/api/rutas/1')[0].cuerpo.activa).toBe(false)
  })

  it('eliminar pide confirmación con el nombre de la ruta', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await screen.findByRole('heading', { name: '2 rutas' })
    await user.click(tablaRutas().getByRole('button', { name: 'Eliminar Norte' }))
    expect(dialogo().getByText('la ruta Norte')).toBeInTheDocument()
    await user.click(dialogo().getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(backend.llamadasA('DELETE', '/api/rutas/2')).toHaveLength(1))
  })
})

describe('Gestión de rutas — paradas y horarios', () => {
  it('al elegir una ruta muestra sus paradas ordenadas y sus horarios', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await elegirRutaCentro(user)
    const paradas = within(screen.getByRole('table', { name: 'Paradas de Centro - UPC' }))
    const filas = paradas.getAllByRole('row').slice(1).map((f) => f.textContent)
    expect(filas[0]).toContain('Parque Principal') // orden 1 antes que orden 2
    expect(filas[1]).toContain('UPC Seccional')
    expect(paradas.getByText('8.31000, -73.61700')).toBeInTheDocument()
    const horarios = within(screen.getByRole('table', { name: 'Horarios de Centro - UPC' }))
    expect(horarios.getByText('06:30')).toBeInTheDocument()
    expect(horarios.getByText('07:00')).toBeInTheDocument()
  })

  it('una ruta sin paradas ni horarios lo avisa', async () => {
    const user = userEvent.setup()
    datos()
    backend.respuestas['GET /api/paradas?ruta_id=2'] = { paradas: [] }
    backend.respuestas['GET /api/horarios?ruta_id=2'] = { horarios: [] }
    abrir()
    await screen.findByRole('heading', { name: '2 rutas' })
    await user.click(tablaRutas().getByRole('button', { name: 'Paradas y horarios de Norte' }))
    expect(await screen.findByText('Esta ruta no tiene paradas registradas.')).toBeInTheDocument()
    expect(screen.getByText('No hay horarios registrados para esta ruta.')).toBeInTheDocument()
  })

  it('agregar horario: exige las dos horas y luego lo crea para esa ruta', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await elegirRutaCentro(user)
    await user.click(screen.getByRole('button', { name: 'Agregar horario' }))
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    expect(dialogo().getByText('Indica la hora de salida.')).toBeInTheDocument()
    expect(dialogo().getByText('Indica la hora de regreso.')).toBeInTheDocument()

    await user.type(dialogo().getByLabelText('Hora de salida'), '14:00')
    await user.type(dialogo().getByLabelText('Hora de regreso'), '14:45')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(backend.llamadasA('POST', '/api/horarios')).toHaveLength(1))
    expect(backend.llamadasA('POST', '/api/horarios')[0].cuerpo).toEqual({ ruta_id: 1, hora_salida: '14:00', hora_llegada: '14:45' })
  })

  it('editar y eliminar un horario', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await elegirRutaCentro(user)
    const horarios = within(screen.getByRole('table', { name: 'Horarios de Centro - UPC' }))

    await user.click(horarios.getByRole('button', { name: 'Editar el horario de las 06:30' }))
    expect(dialogo().getByLabelText('Hora de salida')).toHaveValue('06:30')
    await user.click(dialogo().getByRole('button', { name: 'Cancelar' }))

    await user.click(horarios.getByRole('button', { name: 'Eliminar el horario de las 06:30' }))
    expect(dialogo().getByText('el horario de las 06:30')).toBeInTheDocument()
    await user.click(dialogo().getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(backend.llamadasA('DELETE', '/api/horarios/5')).toHaveLength(1))
  })

  it('eliminar una parada pide confirmación y recarga paradas y rutas', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await elegirRutaCentro(user)
    const paradas = within(screen.getByRole('table', { name: 'Paradas de Centro - UPC' }))
    await user.click(paradas.getByRole('button', { name: 'Eliminar la parada UPC Seccional' }))
    await user.click(dialogo().getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(backend.llamadasA('DELETE', '/api/paradas/12')).toHaveLength(1))
    await waitFor(() => expect(backend.llamadasA('GET', '/api/rutas').length).toBeGreaterThanOrEqual(2))
  })
})
