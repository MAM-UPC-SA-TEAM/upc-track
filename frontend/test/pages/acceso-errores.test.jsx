// Los errores de acceso se ven (rojo + ícono) y se anuncian: el error del servidor recibe el foco. (Issue U20)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

describe('Errores de acceso', () => {
  it('credenciales incorrectas: aviso con rol alert que recibe el foco', async () => {
    backend.respuestas['POST /api/auth/login'] = rechazo(401, 'Usuario o contraseña incorrectos')
    const user = userEvent.setup()
    abrirApp('/login')
    await user.type(await screen.findByLabelText('Usuario'), 'ana')
    await user.type(screen.getByLabelText('Contraseña'), 'mala')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveClass('acceso-aviso')
    expect(aviso).not.toHaveClass('acceso-aviso--ok')
    expect(aviso).toHaveFocus()
  })

  it('campos vacíos: cada campo queda marcado como inválido y con su mensaje', async () => {
    const user = userEvent.setup()
    abrirApp('/login')
    await user.click(await screen.findByRole('button', { name: /entrar/i }))
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Escribe tu nombre de usuario.').closest('.campo-error')).toBeInTheDocument()
  })

  it('error del servidor al registrarse: aviso enfocado', async () => {
    backend.respuestas['POST /api/auth/registro'] = rechazo(400, 'Ya existe una cuenta con ese correo')
    const user = userEvent.setup()
    abrirApp('/registro')
    await user.type(await screen.findByLabelText('Nombre completo'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Nombre de usuario'), 'ana.perez')
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com')
    await user.type(screen.getByLabelText('Contraseña', { selector: 'input' }), 'clavesegura1')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'clavesegura1')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(await screen.findByRole('alert')).toHaveFocus()
  })
})
