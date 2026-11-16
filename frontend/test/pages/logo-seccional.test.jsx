// El logo de la UPC lleva el Seccional Aguachica en el acceso y en el resto de la app. (Issue U22)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { backend, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
  backend.respuestas['GET /api/notificaciones'] = { notificaciones: [] }
})

const ALT = 'Universidad Popular del Cesar, Seccional Aguachica'

describe('Logo de la UPC con el Seccional', () => {
  it('el pie del login muestra el logo con el Seccional', async () => {
    abrirApp('/login')
    expect(await screen.findByRole('img', { name: ALT })).toHaveAttribute('src', expect.stringContaining('logo-upc-aguachica'))
    expect(screen.queryByText(/Seccional Aguachica/)).toBeNull() // ya viene en el logo: sin texto repetido al lado
  })

  it('dentro de la app (panel lateral y pie móvil) también', async () => {
    abrirApp('/perfil', estudiante)
    await screen.findByRole('heading', { name: 'Ana', level: 2 })
    expect(screen.getAllByRole('img', { name: ALT }).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Seccional Aguachica/)).toBeNull()
  })
})
