// Pruebas funcionales de «Notificaciones»: lista, leídas (persistidas en el dispositivo) y tiempo real.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
})

const hace = (min) => new Date(Date.now() - min * 60_000).toISOString()
const lista = () => ({
  notificaciones: [
    { id_notificacion: 1, tipo: 'info', mensaje: 'Bus 1 inició su recorrido', nombre_ruta: 'Ruta Centro', fecha_hora: hace(30) },
    { id_notificacion: 2, tipo: 'retraso', mensaje: 'Tráfico en la avenida', nombre_ruta: 'Ruta Centro', fecha_hora: hace(5) },
    { id_notificacion: 3, tipo: 'cambio_ruta', mensaje: 'Desvío por obras', fecha_hora: hace(120) },
  ],
})
const abrir = () => abrirApp('/notificaciones', estudiante)
const articulos = () => screen.getAllByRole('article')

describe('Notificaciones', () => {
  it('lista los avisos de más nuevo a más viejo, con su tipo y antigüedad', async () => {
    backend.respuestas['GET /api/notificaciones'] = lista()
    abrir()
    await screen.findByText('Tráfico en la avenida')
    const textos = articulos().map((a) => a.textContent)
    expect(textos[0]).toContain('Tráfico en la avenida')   // hace 5 min
    expect(textos[1]).toContain('Bus 1 inició su recorrido') // hace 30 min
    expect(textos[2]).toContain('Desvío por obras')         // hace 2 h
    expect(within(articulos()[0]).getByRole('heading', { name: 'Retraso · Ruta Centro' })).toBeInTheDocument()
    expect(within(articulos()[1]).getByRole('heading', { name: 'Información · Ruta Centro' })).toBeInTheDocument()
    expect(within(articulos()[2]).getByRole('heading', { name: 'Cambio de ruta' })).toBeInTheDocument()
    expect(within(articulos()[0]).getByText('Hace 5 min')).toBeInTheDocument()
    expect(within(articulos()[2]).getByText('Hace 2 h')).toBeInTheDocument()
  })

  it('cuenta los avisos sin leer', async () => {
    backend.respuestas['GET /api/notificaciones'] = lista()
    abrir()
    expect(await screen.findByText('3 sin leer')).toBeInTheDocument()
    expect(screen.getAllByText('Nueva')).toHaveLength(3)
  })

  it('«Marcar como leída» baja el contador y se recuerda al recargar la pantalla', async () => {
    backend.respuestas['GET /api/notificaciones'] = lista()
    const user = userEvent.setup()
    const { unmount } = abrir()
    await screen.findByText('3 sin leer')
    await user.click(within(articulos()[0]).getByRole('button', { name: 'Marcar como leída' }))
    expect(screen.getByText('2 sin leer')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('upctrack.notificaciones.leidas'))).toEqual([2])

    // se vuelve a abrir la pantalla conservando lo guardado en el dispositivo
    unmount()
    window.history.pushState({}, '', '/notificaciones')
    const { default: App } = await import('../../src/App')
    const { render } = await import('@testing-library/react')
    render(<App />)
    expect(await screen.findByText('2 sin leer')).toBeInTheDocument()
  })

  it('«Marcar todas como leídas» deja «Todo al día» y desactiva el botón', async () => {
    backend.respuestas['GET /api/notificaciones'] = lista()
    const user = userEvent.setup()
    abrir()
    await screen.findByText('3 sin leer')
    await user.click(screen.getByRole('button', { name: /marcar todas como leídas/i }))
    expect(screen.getByText('Todo al día')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /marcar todas como leídas/i })).toBeDisabled()
    expect(screen.queryByText('Nueva')).toBeNull()
  })

  it('un aviso que llega por socket aparece arriba y no se duplica', async () => {
    backend.respuestas['GET /api/notificaciones'] = lista()
    abrir()
    await screen.findByText('3 sin leer')
    const nuevo = { id_notificacion: 9, tipo: 'retraso', mensaje: 'Bus detenido por lluvia', nombre_ruta: 'Ruta Norte' }
    act(() => socketFalso.desdeServidor('notificacion:nueva', nuevo))
    expect(articulos()[0]).toHaveTextContent('Bus detenido por lluvia')
    expect(screen.getByText('4 sin leer')).toBeInTheDocument()

    act(() => socketFalso.desdeServidor('notificacion:nueva', nuevo)) // el mismo id otra vez
    expect(articulos()).toHaveLength(4)
  })

  it('sin avisos muestra el estado vacío', async () => {
    backend.respuestas['GET /api/notificaciones'] = { notificaciones: [] }
    abrir()
    expect(await screen.findByText('Sin avisos')).toBeInTheDocument()
  })

  it('un fallo de carga muestra el error y permite reintentar', async () => {
    backend.respuestas['GET /api/notificaciones'] = rechazo(500, 'caído')
    const user = userEvent.setup()
    abrir()
    expect(await screen.findByText('No pudimos cargar')).toBeInTheDocument()
    backend.respuestas['GET /api/notificaciones'] = lista()
    await user.click(screen.getByRole('button', { name: /reintentar ahora/i }))
    expect(await screen.findByText('Tráfico en la avenida')).toBeInTheDocument()
  })
})
