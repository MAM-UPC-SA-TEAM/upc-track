// Pruebas funcionales de «Gestión de usuarios» (CRUD con diálogos), solo para el rol admin.
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

const usuarios = {
  usuarios: [
    { id_usuario: 1, nombre: 'Administrador', nombre_usuario: 'admin', correo: 'admin@upc.edu.co', tipo_usuario: 'admin', activo: 1 },
    { id_usuario: 2, nombre: 'Conductor Demo', nombre_usuario: 'conductor', correo: 'conductor@upc.edu.co', tipo_usuario: 'conductor', activo: 1 },
    { id_usuario: 3, nombre: 'Estudiante Demo', nombre_usuario: 'estudiante', correo: 'estudiante@upc.edu.co', tipo_usuario: 'estudiante', activo: 0 },
  ],
}
const abrir = () => {
  backend.respuestas['GET /api/usuarios'] ??= usuarios
  return abrirApp('/admin/usuarios', admin)
}
const tabla = () => within(screen.getByRole('table', { name: 'Usuarios' }))
const dialogo = () => within(screen.getByRole('dialog'))

describe('Gestión de usuarios — lista', () => {
  it('muestra el conteo, los roles y el estado de cada cuenta', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: '3 usuarios' })).toBeInTheDocument()
    const fila = (nombre) => tabla().getByText(nombre).closest('tr')
    expect(within(fila('Conductor Demo')).getByText('Conductor')).toBeInTheDocument()
    expect(within(fila('Conductor Demo')).getByText('Activo')).toBeInTheDocument()
    expect(within(fila('Estudiante Demo')).getByText('Inactivo')).toBeInTheDocument()
    const filaAdmin = tabla().getByText('admin@upc.edu.co').closest('tr')
    expect(within(filaAdmin).getAllByText('Administrador')).toHaveLength(2) // nombre y rol
  })

  it('sin usuarios muestra el estado vacío', async () => {
    backend.respuestas['GET /api/usuarios'] = { usuarios: [] }
    abrir()
    expect(await screen.findByText('Sin usuarios')).toBeInTheDocument()
  })

  it('un fallo de carga muestra el error y permite reintentar', async () => {
    backend.respuestas['GET /api/usuarios'] = rechazo(500, 'caído')
    const user = userEvent.setup()
    abrirApp('/admin/usuarios', admin)
    expect(await screen.findByText('No pudimos cargar')).toBeInTheDocument()
    backend.respuestas['GET /api/usuarios'] = usuarios
    await user.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(await screen.findByRole('heading', { name: '3 usuarios' })).toBeInTheDocument()
  })
})

describe('Gestión de usuarios — crear', () => {
  it('valida los campos antes de enviar y enfoca el primero con error', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar usuario' }))
    await user.type(dialogo().getByLabelText('Nombre de usuario'), 'a b')
    await user.type(dialogo().getByLabelText('Correo'), 'no-es-correo')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))

    expect(dialogo().getByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(dialogo().getByText(/Solo letras, números, punto, guion/)).toBeInTheDocument()
    expect(dialogo().getByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(dialogo().getByText('La contraseña es obligatoria.')).toBeInTheDocument()
    expect(backend.llamadasA('POST', '/api/usuarios')).toHaveLength(0)
  })

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar usuario' }))
    await user.type(dialogo().getByLabelText('Contraseña', { exact: true }), '123')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    expect(dialogo().getByText('Mínimo 8 caracteres.', { selector: '.campo-error span' })).toBeInTheDocument()
  })

  it('crea el usuario, cierra el diálogo y recarga la lista', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar usuario' }))
    await user.type(dialogo().getByLabelText('Nombre completo'), 'Luis Gómez')
    await user.type(dialogo().getByLabelText('Nombre de usuario'), 'luis.gomez')
    await user.type(dialogo().getByLabelText('Correo'), 'luis@unicesar.edu.co')
    await user.type(dialogo().getByLabelText('Contraseña', { exact: true }), 'clave12345')
    await user.selectOptions(dialogo().getByLabelText('Rol'), 'conductor')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(backend.llamadasA('POST', '/api/usuarios')[0].cuerpo).toMatchObject({
      nombre: 'Luis Gómez', nombre_usuario: 'luis.gomez', correo: 'luis@unicesar.edu.co', tipo_usuario: 'conductor', activo: true,
    })
    expect(backend.llamadasA('GET', '/api/usuarios')).toHaveLength(2) // carga inicial + recarga
  })

  it('el error del servidor se muestra dentro del diálogo y no lo cierra', async () => {
    backend.respuestas['POST /api/usuarios'] = rechazo(400, 'Ese nombre de usuario ya está en uso')
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar usuario' }))
    await user.type(dialogo().getByLabelText('Nombre completo'), 'Luis')
    await user.type(dialogo().getByLabelText('Correo'), 'luis@unicesar.edu.co')
    await user.type(dialogo().getByLabelText('Contraseña', { exact: true }), 'clave12345')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    expect(await dialogo().findByRole('alert')).toHaveTextContent('Ese nombre de usuario ya está en uso')
  })

  it('Cancelar cierra el diálogo sin enviar nada', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Agregar usuario' }))
    await user.click(dialogo().getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(backend.llamadasA('POST', '/api/usuarios')).toHaveLength(0)
  })
})

describe('Gestión de usuarios — editar y eliminar', () => {
  it('Editar precarga los datos y la contraseña es opcional', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: '3 usuarios' })
    await user.click(tabla().getByRole('button', { name: 'Editar Conductor Demo' }))

    expect(dialogo().getByLabelText('Nombre completo')).toHaveValue('Conductor Demo')
    expect(dialogo().getByLabelText('Rol')).toHaveValue('conductor')
    expect(dialogo().getByText('Déjala vacía para no cambiarla.')).toBeInTheDocument()

    await user.clear(dialogo().getByLabelText('Nombre completo'))
    await user.type(dialogo().getByLabelText('Nombre completo'), 'Pedro Conductor')
    await user.click(dialogo().getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const llamada = backend.llamadasA('PATCH', '/api/usuarios/2')[0]
    expect(llamada.cuerpo.nombre).toBe('Pedro Conductor')
    expect(llamada.cuerpo.password).toBe('')
  })

  it('Eliminar pide confirmación y borra al usuario elegido', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: '3 usuarios' })
    await user.click(tabla().getByRole('button', { name: 'Eliminar Estudiante Demo' }))
    expect(dialogo().getByText('Estudiante Demo')).toBeInTheDocument()
    expect(backend.llamadasA('DELETE', '/api/usuarios/3')).toHaveLength(0) // aún no
    await user.click(dialogo().getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(backend.llamadasA('DELETE', '/api/usuarios/3')).toHaveLength(1))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('cancelar la confirmación no borra nada', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: '3 usuarios' })
    await user.click(tabla().getByRole('button', { name: 'Eliminar Estudiante Demo' }))
    await user.click(dialogo().getByRole('button', { name: 'Cancelar' }))
    expect(backend.llamadas.filter((l) => l.metodo === 'DELETE')).toHaveLength(0)
  })

  it('si el servidor no deja eliminar, muestra el motivo en la confirmación', async () => {
    backend.respuestas['DELETE /api/usuarios/3'] = rechazo(500, 'No se pudo eliminar: tiene datos asociados')
    const user = userEvent.setup()
    abrir()
    await screen.findByRole('heading', { name: '3 usuarios' })
    await user.click(tabla().getByRole('button', { name: 'Eliminar Estudiante Demo' }))
    await user.click(dialogo().getByRole('button', { name: 'Eliminar' }))
    expect(await dialogo().findByRole('alert')).toHaveTextContent('tiene datos asociados')
  })
})
