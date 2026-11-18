// Pruebas funcionales de «Mi perfil»: solo MUESTRA los datos; editarlos es de «Configuración». (Issue U21)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

const ana = { ...estudiante, correo: 'ana@unicesar.edu.co' }
const seccionDatos = () => screen.getByRole('heading', { name: 'Datos personales' }).closest('section')

describe('Mi perfil (solo lectura)', () => {
  it('muestra nombre y correo de la sesión; no hay campo «Documento»', async () => {
    abrirApp('/perfil', ana)
    expect(await screen.findByRole('heading', { name: 'Ana', level: 2 })).toBeInTheDocument()
    const datos = within(seccionDatos())
    expect(datos.getByText('ana@unicesar.edu.co')).toBeInTheDocument()
    expect(datos.getByText('Nombre de usuario')).toBeInTheDocument()
    expect(datos.getByText('ana')).toBeInTheDocument()
    expect(datos.queryByText('Documento')).toBeNull()
    expect(screen.getAllByText('estudiante').length).toBeGreaterThan(0)
  })

  it('un dato que falta se marca como «Sin registrar»', async () => {
    abrirApp('/perfil', estudiante) // sin correo
    await screen.findByRole('heading', { name: 'Ana', level: 2 })
    expect(within(seccionDatos()).getByText('Sin registrar')).toBeInTheDocument()
  })

  it('no tiene campos ni botones de edición', async () => {
    abrirApp('/perfil', ana)
    await screen.findByRole('heading', { name: 'Ana', level: 2 })
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /editar|guardar|contraseña/i })).toBeNull()
  })

  it('el enlace «Configuración» lleva a la pantalla de edición', async () => {
    const user = userEvent.setup()
    abrirApp('/perfil', ana)
    await user.click(await screen.findByRole('link', { name: /configuración/i }))
    expect(await screen.findByLabelText('Nombre completo')).toHaveValue('Ana')
    expect(window.location.pathname).toBe('/configuracion')
  })
})

describe('Menú de la cuenta', () => {
  it('el nombre accesible del avatar incluye sus iniciales visibles (WCAG 2.5.3)', async () => {
    abrirApp('/inicio', ana)
    backend.respuestas['GET /api/notificaciones'] = { notificaciones: [] }
    const boton = await screen.findByRole('button', { name: /cuenta de ana/i })
    expect(boton).toHaveAccessibleName(`${boton.textContent}, cuenta de Ana`)
  })

  it('«Ver perfil» y «Configuración» llevan a pantallas distintas', async () => {
    const user = userEvent.setup()
    abrirApp('/inicio', ana)
    backend.respuestas['GET /api/notificaciones'] = { notificaciones: [] }

    await user.click(await screen.findByRole('button', { name: /cuenta de ana/i }))
    await user.click(screen.getByRole('button', { name: 'Configuración' }))
    expect(window.location.pathname).toBe('/configuracion')

    await user.click(screen.getByRole('button', { name: /cuenta de ana/i }))
    await user.click(screen.getByRole('button', { name: 'Ver perfil' }))
    expect(window.location.pathname).toBe('/perfil')
  })

  it('en Configuración la pestaña «Perfil» del nav sigue marcada', async () => {
    abrirApp('/configuracion', ana)
    await screen.findByLabelText('Nombre completo')
    const nav = screen.getAllByRole('navigation', { name: 'Principal' })
    const activos = nav.flatMap(n => [...n.querySelectorAll('.botnav-item--activo, .sidebar-link--activo')])
    expect(activos.some(a => a.textContent.includes('Perfil'))).toBe(true)
  })
})
