// El diálogo de administración no pierde lo escrito al tocar fuera o pulsar Esc. (Issue U13)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, admin } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
  backend.respuestas['GET /api/usuarios'] = { usuarios: [] }
})

const tocarFondo = () => fireEvent.click(screen.getByRole('dialog'))
const pulsarEsc = () => fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

async function abrirFormulario() {
  const user = userEvent.setup()
  abrirApp('/admin/usuarios', admin)
  await user.click(await screen.findByRole('button', { name: 'Agregar usuario' }))
  return user
}

describe('Diálogo de administración: cambios sin guardar', () => {
  it('tocar el fondo sin haber escrito nada cierra de inmediato', async () => {
    await abrirFormulario()
    tocarFondo()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('tocar el fondo con cambios pide confirmar y conserva lo escrito', async () => {
    const user = await abrirFormulario()
    await user.type(screen.getByLabelText('Nombre completo'), 'Marta Ruiz')
    tocarFondo()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Tienes cambios sin guardar.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Marta Ruiz')
  })

  it('«Seguir editando» vuelve al formulario con los datos intactos', async () => {
    const user = await abrirFormulario()
    await user.type(screen.getByLabelText('Nombre completo'), 'Marta Ruiz')
    pulsarEsc()
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }))
    expect(screen.queryByText('Tienes cambios sin guardar.')).toBeNull()
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Marta Ruiz')
  })

  it('«Descartar» cierra y el siguiente formulario abre limpio', async () => {
    const user = await abrirFormulario()
    await user.type(screen.getByLabelText('Nombre completo'), 'Marta Ruiz')
    tocarFondo()
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Agregar usuario' }))
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('')
    expect(screen.queryByText('Tienes cambios sin guardar.')).toBeNull()
  })

  it('«Cancelar» y «✕» cierran directamente aunque haya cambios', async () => {
    const user = await abrirFormulario()
    await user.type(screen.getByLabelText('Nombre completo'), 'Marta Ruiz')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Agregar usuario' }))
    await user.type(screen.getByLabelText('Nombre completo'), 'Otra')
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Esc con cambios pide confirmar; sin cambios cierra', async () => {
    const user = await abrirFormulario()
    pulsarEsc()
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Agregar usuario' }))
    await user.type(screen.getByLabelText('Nombre completo'), 'x')
    pulsarEsc()
    expect(screen.getByText('Tienes cambios sin guardar.')).toBeInTheDocument()
  })
})
