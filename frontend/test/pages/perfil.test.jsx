// Pruebas funcionales de «Mi perfil»: datos personales y cambio de contraseña (app completa, backend falso).
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

const ana = { ...estudiante, correo: 'ana@unicesar.edu.co' }
const abrir = (usuario = ana) => abrirApp('/perfil', usuario)
const seccionDatos = () => screen.getByRole('heading', { name: 'Datos personales' }).closest('section')

describe('Mi perfil — datos personales', () => {
  it('muestra los datos de la sesión y marca lo que falta como «Sin registrar»', async () => {
    abrir()
    expect(await screen.findByRole('heading', { name: 'Ana', level: 2 })).toBeInTheDocument()
    const datos = within(seccionDatos())
    expect(datos.getByText('ana@unicesar.edu.co')).toBeInTheDocument()
    expect(datos.getByText('Sin registrar')).toBeInTheDocument() // documento
    expect(screen.getAllByText('estudiante').length).toBeGreaterThan(0)
  })

  it('Editar abre el formulario con los datos vigentes y Cancelar lo cierra', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: /editar/i }))
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@unicesar.edu.co')
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByLabelText('Nombre completo')).toBeNull()
  })

  it('valida nombre vacío y correo inválido sin llamar al backend', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: /editar/i }))
    await user.clear(screen.getByLabelText('Nombre completo'))
    await user.clear(screen.getByLabelText('Correo electrónico'))
    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-correo')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))
    expect(screen.getByText('El nombre no puede estar vacío.')).toBeInTheDocument()
    expect(screen.getByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveFocus()
    expect(backend.llamadasA('PATCH', '/api/usuarios/perfil')).toHaveLength(0)
  })

  it('guarda, avisa «Datos guardados.» y muestra los datos nuevos que devuelve el servidor', async () => {
    backend.respuestas['PATCH /api/usuarios/perfil'] = { ok: true, usuario: { ...ana, nombre: 'Ana María', correo: 'maria@unicesar.edu.co' } }
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: /editar/i }))
    await user.clear(screen.getByLabelText('Nombre completo'))
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana María')
    await user.clear(screen.getByLabelText('Correo electrónico'))
    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@unicesar.edu.co')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Datos guardados.')
    expect(backend.llamadasA('PATCH', '/api/usuarios/perfil')[0].cuerpo).toMatchObject({ nombre: 'Ana María', correo: 'maria@unicesar.edu.co' })
    expect(screen.getByRole('heading', { name: 'Ana María', level: 2 })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('usuario')).nombre).toBe('Ana María')
  })

  it('muestra el error del servidor y deja el formulario abierto', async () => {
    backend.respuestas['PATCH /api/usuarios/perfil'] = rechazo(400, 'Ese correo ya está en uso')
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: /editar/i }))
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese correo ya está en uso')
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
  })
})

describe('Mi perfil — cambiar contraseña', () => {
  const abrirFormulario = async (user) => {
    abrir()
    await user.click(await screen.findByRole('button', { name: /cambiar contraseña/i }))
  }

  it('el formulario está plegado hasta que se abre', async () => {
    abrir()
    const boton = await screen.findByRole('button', { name: /cambiar contraseña/i })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Contraseña actual')).toBeNull()
    await userEvent.setup().click(boton)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Contraseña actual')).toBeInTheDocument()
  })

  it('valida los tres campos', async () => {
    const user = userEvent.setup()
    await abrirFormulario(user)
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    expect(screen.getByText('Escribe tu contraseña actual.')).toBeInTheDocument()
    expect(screen.getByText('Escribe la nueva contraseña.')).toBeInTheDocument()
  })

  it('rechaza una contraseña nueva corta y una confirmación distinta', async () => {
    const user = userEvent.setup()
    await abrirFormulario(user)
    await user.type(screen.getByLabelText('Contraseña actual'), 'vieja1234')
    await user.type(screen.getByLabelText('Nueva contraseña'), '123')
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), '456')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    expect(screen.getByText('Mínimo 8 caracteres.', { selector: '.campo-error span' })).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas nuevas no coinciden.')).toBeInTheDocument()
    expect(backend.llamadasA('PATCH', '/api/usuarios/password')).toHaveLength(0)
  })

  it('actualiza la contraseña, avisa y limpia los campos', async () => {
    const user = userEvent.setup()
    await abrirFormulario(user)
    await user.type(screen.getByLabelText('Contraseña actual'), 'vieja1234')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'nueva12345')
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'nueva12345')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    expect(await screen.findByText('Contraseña actualizada.')).toBeInTheDocument()
    expect(backend.llamadasA('PATCH', '/api/usuarios/password')[0].cuerpo).toEqual({ password_actual: 'vieja1234', password_nueva: 'nueva12345' })
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('')
  })

  it('si la contraseña actual es incorrecta muestra el error del servidor', async () => {
    backend.respuestas['PATCH /api/usuarios/password'] = rechazo(401, 'La contraseña actual es incorrecta')
    const user = userEvent.setup()
    await abrirFormulario(user)
    await user.type(screen.getByLabelText('Contraseña actual'), 'equivocada1')
    await user.type(screen.getByLabelText('Nueva contraseña'), 'nueva12345')
    await user.type(screen.getByLabelText('Confirmar nueva contraseña'), 'nueva12345')
    await user.click(screen.getByRole('button', { name: /actualizar contraseña/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual es incorrecta')
  })

  it('«Mostrar contraseñas» muestra u oculta los tres campos', async () => {
    const user = userEvent.setup()
    await abrirFormulario(user)
    await user.click(screen.getByLabelText('Mostrar contraseñas'))
    for (const campo of ['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva contraseña']) {
      expect(screen.getByLabelText(campo)).toHaveAttribute('type', 'text')
    }
  })
})
