// Pruebas funcionales de «Gestión de buses»: lista, alta con ruta y conductor, edición y borrado.
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
  backend.respuestas['GET /api/buses'] = {
    buses: [
      { id_bus: 1, nombre: 'Bus 1', placa: 'UPC-001', id_ruta: 1, nombre_ruta: 'Centro - UPC', id_conductor: 2, nombre_conductor: 'Conductor Demo', estado: 'en_recorrido' },
      { id_bus: 2, nombre: 'Bus 2', placa: 'UPC-002', estado: 'fuera_de_servicio' },
    ],
  }
  backend.respuestas['GET /api/rutas'] = { rutas: [{ id_ruta: 1, nombre: 'Centro - UPC', activa: 1 }, { id_ruta: 2, nombre: 'Norte', activa: 1 }] }
  backend.respuestas['GET /api/usuarios'] = {
    usuarios: [
      { id_usuario: 2, nombre: 'Conductor Demo', tipo_usuario: 'conductor', activo: 1 },
      { id_usuario: 4, nombre: 'Conductor Inactivo', tipo_usuario: 'conductor', activo: 0 },
      { id_usuario: 5, nombre: 'Un Estudiante', tipo_usuario: 'estudiante', activo: 1 },
    ],
  }
}
const abrir = () => abrirApp('/admin/buses', admin)
const tabla = () => within(screen.getByRole('table', { name: 'Buses' }))
const dialogo = () => within(screen.getByRole('dialog'))

describe('Gestión de buses', () => {
  it('muestra cada bus con su placa, ruta, conductor y estado', async () => {
    datos()
    abrir()
    expect(await screen.findByRole('heading', { name: '2 buses' })).toBeInTheDocument()
    const bus1 = within(tabla().getByText('Bus 1').closest('tr'))
    expect(bus1.getByText('UPC-001')).toBeInTheDocument()
    expect(bus1.getByText('Centro - UPC')).toBeInTheDocument()
    expect(bus1.getByText('Conductor Demo')).toBeInTheDocument()
    expect(bus1.getByText('En servicio')).toBeInTheDocument()
    const bus2 = within(tabla().getByText('Bus 2').closest('tr'))
    expect(bus2.getByText('Sin ruta')).toBeInTheDocument()
    expect(bus2.getByText('Sin conductor')).toBeInTheDocument()
    expect(bus2.getByText('Fuera de servicio')).toBeInTheDocument()
  })

  it('sin buses muestra el estado vacío; con fallo, el error y reintentar', async () => {
    const user = userEvent.setup()
    datos()
    backend.respuestas['GET /api/buses'] = rechazo(500, 'caído')
    abrir()
    expect(await screen.findByText('No pudimos cargar')).toBeInTheDocument()
    backend.respuestas['GET /api/buses'] = { buses: [] }
    await user.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(await screen.findByText('Sin buses')).toBeInTheDocument()
  })

  it('el formulario ofrece solo rutas y conductores ACTIVOS, y un bus nuevo nace fuera de servicio', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar bus' }))
    const conductores = within(dialogo().getByLabelText('Conductor asignado')).getAllByRole('option').map((o) => o.textContent)
    expect(conductores).toEqual(['Sin conductor', 'Conductor Demo']) // sin el inactivo ni el estudiante
    const rutas = within(dialogo().getByLabelText('Ruta asignada')).getAllByRole('option').map((o) => o.textContent)
    expect(rutas).toEqual(['Sin ruta', 'Centro - UPC', 'Norte'])
    expect(dialogo().getByLabelText('Estado')).toHaveValue('fuera_de_servicio')
  })

  it('valida nombre y placa obligatorios', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar bus' }))
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    expect(dialogo().getByText('El nombre del bus es obligatorio.')).toBeInTheDocument()
    expect(dialogo().getByText('La placa es obligatoria.')).toBeInTheDocument()
    expect(backend.llamadasA('POST', '/api/buses')).toHaveLength(0)
  })

  it('crea el bus con su ruta y conductor y recarga la lista', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar bus' }))
    await user.type(dialogo().getByLabelText('Nombre del bus'), 'Bus 3')
    await user.type(dialogo().getByLabelText('Placa'), 'UPC-003')
    await user.selectOptions(dialogo().getByLabelText('Ruta asignada'), '2')
    await user.selectOptions(dialogo().getByLabelText('Conductor asignado'), '2')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(backend.llamadasA('POST', '/api/buses')[0].cuerpo).toMatchObject({
      nombre: 'Bus 3', placa: 'UPC-003', id_ruta: '2', id_conductor: '2', estado: 'fuera_de_servicio',
    })
    expect(backend.llamadasA('GET', '/api/buses')).toHaveLength(2)
  })

  it('una placa repetida muestra el error del servidor', async () => {
    backend.respuestas['POST /api/buses'] = rechazo(400, 'Ya existe un bus con esa placa')
    const user = userEvent.setup()
    datos()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar bus' }))
    await user.type(dialogo().getByLabelText('Nombre del bus'), 'Bus 3')
    await user.type(dialogo().getByLabelText('Placa'), 'UPC-001')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    expect(await dialogo().findByRole('alert')).toHaveTextContent('Ya existe un bus con esa placa')
  })

  it('Editar precarga los datos del bus y guarda con PATCH', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await screen.findByRole('heading', { name: '2 buses' })
    await user.click(tabla().getByRole('button', { name: 'Editar Bus 1' }))
    expect(dialogo().getByLabelText('Placa')).toHaveValue('UPC-001')
    expect(dialogo().getByLabelText('Ruta asignada')).toHaveValue('1')
    expect(dialogo().getByLabelText('Estado')).toHaveValue('en_recorrido')

    await user.selectOptions(dialogo().getByLabelText('Estado'), 'detenido')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(backend.llamadasA('PATCH', '/api/buses/1')).toHaveLength(1))
    expect(backend.llamadasA('PATCH', '/api/buses/1')[0].cuerpo.estado).toBe('detenido')
  })

  it('Eliminar pide confirmación y borra el bus elegido', async () => {
    const user = userEvent.setup()
    datos()
    abrir()
    await screen.findByRole('heading', { name: '2 buses' })
    await user.click(tabla().getByRole('button', { name: 'Eliminar Bus 2' }))
    expect(backend.llamadasA('DELETE', '/api/buses/2')).toHaveLength(0)
    await user.click(dialogo().getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(backend.llamadasA('DELETE', '/api/buses/2')).toHaveLength(1))
  })

  it('si el borrado falla, el motivo aparece en la confirmación', async () => {
    backend.respuestas['DELETE /api/buses/2'] = rechazo(500, 'El bus tiene historial')
    const user = userEvent.setup()
    datos()
    abrir()
    await screen.findByRole('heading', { name: '2 buses' })
    await user.click(tabla().getByRole('button', { name: 'Eliminar Bus 2' }))
    await user.click(dialogo().getByRole('button', { name: 'Eliminar' }))
    expect(await dialogo().findByRole('alert')).toHaveTextContent('El bus tiene historial')
  })
})
