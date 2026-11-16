// Pruebas funcionales de «Configuración»: editar datos personales y cambiar la contraseña (app completa, backend falso). (Issue U21)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
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
const abrir = (usuario = ana) => abrirApp('/configuracion', usuario)

describe('Configuración — datos personales', () => {
  it('el formulario llega con los datos vigentes, sin pulsar «Editar»', async () => {
    abrir()
    expect(await screen.findByLabelText('Nombre completo')).toHaveValue('Ana')
    expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('ana')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@unicesar.edu.co')
    expect(screen.queryByRole('button', { name: /^editar/i })).toBeNull()
    expect(screen.queryByLabelText('Documento')).toBeNull() // campo retirado: el backend nunca lo guardaba
  })

  it('valida nombre vacío y correo inválido sin llamar al backend', async () => {
    const user = userEvent.setup()
    abrir()
    await user.clear(await screen.findByLabelText('Nombre completo'))
    await user.clear(screen.getByLabelText('Correo electrónico'))
    await user.type(screen.getByLabelText('Correo electrónico'), 'no-es-correo')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))
    expect(screen.getByText('El nombre no puede estar vacío.')).toBeInTheDocument()
    expect(screen.getByText('Escribe un correo válido.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveFocus()
    expect(backend.llamadasA('PATCH', '/api/usuarios/perfil')).toHaveLength(0)
  })

  it('guarda, avisa «Datos guardados.» y conserva los datos nuevos que devuelve el servidor', async () => {
    backend.respuestas['PATCH /api/usuarios/perfil'] = { ok: true, usuario: { ...ana, nombre: 'Ana María', correo: 'maria@unicesar.edu.co' } }
    const user = userEvent.setup()
    abrir()
    await user.clear(await screen.findByLabelText('Nombre completo'))
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana María')
    await user.clear(screen.getByLabelText('Correo electrónico'))
    await user.type(screen.getByLabelText('Correo electrónico'), 'maria@unicesar.edu.co')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Datos guardados.')
    expect(backend.llamadasA('PATCH', '/api/usuarios/perfil')[0].cuerpo).toEqual({ nombre: 'Ana María', nombre_usuario: 'ana', correo: 'maria@unicesar.edu.co' })
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana María')
    expect(JSON.parse(localStorage.getItem('usuario')).nombre).toBe('Ana María')
  })

  it('cambia el nombre de usuario: lo envía, guarda el token nuevo y la sesión usa el nombre nuevo (U23)', async () => {
    backend.respuestas['PATCH /api/usuarios/perfil'] = { ok: true, usuario: { ...ana, nombre_usuario: 'ana.perez' }, token: 'token.nuevo.firmado' }
    const user = userEvent.setup()
    abrir()
    const campo = await screen.findByLabelText('Nombre de usuario')
    await user.clear(campo)
    await user.type(campo, 'ana.perez')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByRole('status')).toHaveTextContent('Datos guardados.')
    expect(backend.llamadasA('PATCH', '/api/usuarios/perfil')[0].cuerpo).toMatchObject({ nombre_usuario: 'ana.perez' })
    expect(localStorage.getItem('token')).toBe('token.nuevo.firmado')
    expect(JSON.parse(localStorage.getItem('usuario')).nombre_usuario).toBe('ana.perez')
  })

  it('tras guardar, el campo muestra el nombre de usuario como lo guardó el servidor (minúsculas)', async () => {
    backend.respuestas['PATCH /api/usuarios/perfil'] = { ok: true, usuario: { ...ana, nombre_usuario: 'ana.perez' }, token: 'token.nuevo.firmado' }
    const user = userEvent.setup()
    abrir()
    const campo = await screen.findByLabelText('Nombre de usuario')
    await user.clear(campo)
    await user.type(campo, 'Ana.Perez')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))
    await screen.findByRole('status')
    expect(screen.getByLabelText('Nombre de usuario')).toHaveValue('ana.perez')
  })

  it('rechaza un nombre de usuario con formato inválido antes de llamar al backend', async () => {
    const user = userEvent.setup()
    abrir()
    for (const malo of ['ab', 'con espacio', 'a'.repeat(21)]) {
      const campo = await screen.findByLabelText('Nombre de usuario')
      await user.clear(campo)
      await user.type(campo, malo)
      await user.click(screen.getByRole('button', { name: /guardar cambios/i }))
      expect(screen.getByText(/de 3 a 20 caracteres: letras, números, punto, guion o guion bajo/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre de usuario')).toHaveFocus()
    }
    expect(backend.llamadasA('PATCH', '/api/usuarios/perfil')).toHaveLength(0)
  })

  it('un nombre de usuario ya tomado (409) se dice en el propio campo y no cambia la sesión', async () => {
    backend.respuestas['PATCH /api/usuarios/perfil'] = rechazo(409, 'Ese nombre de usuario ya está en uso')
    const user = userEvent.setup()
    abrir()
    const tokenAntes = localStorage.getItem('token')
    const campo = await screen.findByLabelText('Nombre de usuario')
    await user.clear(campo)
    await user.type(campo, 'ocupado')
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText('Ese nombre de usuario ya está en uso')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre de usuario')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nombre de usuario')).toHaveFocus()
    expect(localStorage.getItem('token')).toBe(tokenAntes)
    expect(JSON.parse(localStorage.getItem('usuario')).nombre_usuario).toBe('ana')
  })

  it('muestra el error del servidor y conserva lo escrito', async () => {
    backend.respuestas['PATCH /api/usuarios/perfil'] = rechazo(400, 'Ese correo ya está en uso')
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: /guardar cambios/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese correo ya está en uso')
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
  })
})

describe('Configuración — cambiar contraseña', () => {
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
