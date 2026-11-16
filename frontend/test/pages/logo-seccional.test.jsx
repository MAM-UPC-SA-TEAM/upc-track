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
    const logos = await screen.findAllByRole('img', { name: ALT })
    // Dos versiones: la clara y la de fondo oscuro; el CSS deja visible la del tema activo
    expect(logos.map(l => l.getAttribute('src')).some(src => src.includes('logo-upc-aguachica') && !src.includes('oscuro'))).toBe(true)
    expect(logos.map(l => l.getAttribute('src')).some(src => src.includes('logo-upc-aguachica-oscuro'))).toBe(true)
    expect(screen.queryByText(/Seccional Aguachica/)).toBeNull() // ya viene en el logo: sin texto repetido al lado
  })

  it('dentro de la app (panel lateral y pie móvil) también', async () => {
    abrirApp('/perfil', estudiante)
    await screen.findByRole('heading', { name: 'Ana', level: 2 })
    expect(screen.getAllByRole('img', { name: ALT }).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText(/Seccional Aguachica/)).toBeNull()
  })
})

describe('Logos con variante para fondo oscuro (U33)', () => {
  it('cada logo tiene su versión clara y oscura, con la clase que el CSS usa para elegir', async () => {
    abrirApp('/login')
    await screen.findAllByRole('img', { name: ALT })
    const claros = document.querySelectorAll('img.logo-claro')
    const oscuros = document.querySelectorAll('img.logo-oscuro')
    expect(claros.length).toBe(oscuros.length)
    expect(claros.length).toBeGreaterThanOrEqual(2) // marca de UpcTrack y logo de la UPC
    for (const o of oscuros) expect(o.getAttribute('src')).toMatch(/oscuro/)
    for (const c of claros) expect(c.getAttribute('src')).not.toMatch(/oscuro/)
  })

  it('no queda ningún recuadro de papel detrás de los logos en oscuro (el CSS no lo declara)', async () => {
    const { readFileSync } = await import('node:fs')
    const css = ['components/acceso/Acceso.css', 'components/shared/Layout.css']
      .map(f => readFileSync(`${import.meta.dirname}/../../src/${f}`, 'utf8')).join('\n')
    expect(css).not.toMatch(/\.(acceso-mark|topbar-marca|acceso-pie img|layout-pie img)[^{]*\{[^}]*background:\s*#fbfaf4/)
  })
})
