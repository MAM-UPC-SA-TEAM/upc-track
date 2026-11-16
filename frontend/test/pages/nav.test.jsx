// Navegación inferior por rol: Buses entra al nav móvil del estudiante y Alertas pasa a la campana. (Issue U25)
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
  backend.respuestas['GET /api/notificaciones'] = { notificaciones: [] }
})

const barraInferior = () => document.querySelector('.botnav')

describe('Navegación del estudiante', () => {
  it('la barra inferior tiene cinco destinos: Inicio, Mapa, Rutas, Buses y Perfil', async () => {
    abrirApp('/perfil', estudiante)
    await screen.findByRole('heading', { name: 'Ana', level: 2 })
    const etiquetas = [...barraInferior().querySelectorAll('.botnav-item')].map(a => a.textContent.trim())
    expect(etiquetas).toEqual(['Inicio', 'Mapa', 'Rutas', 'Buses', 'Perfil'])
  })

  it('«Buses» de la barra inferior lleva a la lista de buses', async () => {
    abrirApp('/perfil', estudiante)
    await screen.findByRole('heading', { name: 'Ana', level: 2 })
    expect(within(barraInferior()).getByRole('link', { name: /buses/i })).toHaveAttribute('href', '/buses')
  })

  it('las alertas se abren desde la campana de la barra superior', async () => {
    const user = userEvent.setup()
    abrirApp('/perfil', estudiante)
    await user.click(await screen.findByRole('button', { name: /notificaciones/i }))
    await user.click(screen.getByRole('button', { name: 'Ver todas' }))
    expect(window.location.pathname).toBe('/notificaciones')
  })
})
