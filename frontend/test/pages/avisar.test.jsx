// «Avisar»: el conductor envía retraso/cambio de ruta/info a su ruta y ve lo enviado; no recibe avisos ajenos. (Issue U26)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend, rechazo, socketFalso } from '../helpers/mundoFalso'
import { abrirApp, conductor, estudiante } from '../helpers/abrirApp'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

const hace = (min) => new Date(Date.now() - min * 60_000).toISOString()
const enviado = (id, tipo, mensaje, min) => ({ id_notificacion: id, tipo, mensaje, fecha_hora: hace(min), id_ruta: 1, nombre_ruta: 'Centro - UPC' })

beforeEach(() => {
  backend.reset()
  socketFalso.reset()
  backend.respuestas['GET /api/notificaciones/mias'] = { notificaciones: [] }
})

describe('Avisar (conductor)', () => {
  it('el nav del conductor es Mi recorrido, Avisar y Perfil; sin Alertas ni campana', async () => {
    abrirApp('/avisar', conductor)
    await screen.findByRole('heading', { name: 'Nuevo aviso' })
    const etiquetas = [...document.querySelectorAll('.botnav .botnav-item')].map(a => a.textContent.trim())
    expect(etiquetas).toEqual(['Mi recorrido', 'Avisar', 'Perfil'])
    expect(screen.queryByRole('button', { name: /notificaciones/i })).toBeNull()
  })

  it('envía el aviso con su tipo, confirma y vacía el mensaje', async () => {
    backend.respuestas['POST /api/notificaciones'] = { ok: true }
    const user = userEvent.setup()
    abrirApp('/avisar', conductor)
    await user.click(await screen.findByRole('radio', { name: 'Retraso' }))
    await user.type(screen.getByLabelText('Mensaje del aviso'), 'Tráfico en la Calle 7')
    await user.click(screen.getByRole('button', { name: /enviar aviso/i }))
    expect(await screen.findByText('Aviso enviado a tu ruta.')).toBeInTheDocument()
    expect(backend.llamadasA('POST', '/api/notificaciones')[0].cuerpo).toEqual({ tipo: 'retraso', mensaje: 'Tráfico en la Calle 7' })
    expect(screen.getByLabelText('Mensaje del aviso')).toHaveValue('')
  })

  it('«Enviar aviso» no se puede pulsar con el mensaje vacío', async () => {
    abrirApp('/avisar', conductor)
    expect(await screen.findByRole('button', { name: /enviar aviso/i })).toBeDisabled()
  })

  it('si el envío falla lo dice y conserva el mensaje', async () => {
    backend.respuestas['POST /api/notificaciones'] = rechazo(500, 'caído')
    const user = userEvent.setup()
    abrirApp('/avisar', conductor)
    await user.type(await screen.findByLabelText('Mensaje del aviso'), 'Desvío')
    await user.click(screen.getByRole('button', { name: /enviar aviso/i }))
    expect(await screen.findByText('No se pudo enviar. Intenta de nuevo.')).toBeInTheDocument()
    expect(screen.getByLabelText('Mensaje del aviso')).toHaveValue('Desvío')
  })

  it('lista lo que ya envió, con su tipo y hora; sin envíos dice que no hay', async () => {
    backend.respuestas['GET /api/notificaciones/mias'] = {
      notificaciones: [enviado(2, 'retraso', 'Tráfico pesado', 5), enviado(1, 'info', 'Inicié el recorrido', 90)],
    }
    abrirApp('/avisar', conductor)
    const lista = within((await screen.findByRole('heading', { name: 'Enviados' })).closest('section'))
    expect(await lista.findByText('Tráfico pesado')).toBeInTheDocument()
    expect(lista.getByText(/Retraso · Centro - UPC/)).toBeInTheDocument()
    expect(lista.getByText('Hace 5 min')).toBeInTheDocument()
    expect(lista.getByText('Hace 1 h')).toBeInTheDocument()
  })

  it('sin avisos enviados lo indica', async () => {
    abrirApp('/avisar', conductor)
    expect(await screen.findByText('Aún no has enviado avisos.')).toBeInTheDocument()
  })

  it('un fallo al cargar lo enviado permite reintentar', async () => {
    backend.respuestas['GET /api/notificaciones/mias'] = rechazo(500, 'caído')
    const user = userEvent.setup()
    abrirApp('/avisar', conductor)
    expect(await screen.findByText(/No se pudieron cargar tus avisos/)).toBeInTheDocument()
    backend.respuestas['GET /api/notificaciones/mias'] = { notificaciones: [enviado(3, 'info', 'Listo', 1)] }
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Listo')).toBeInTheDocument()
  })

  it('actualiza la lista de enviados después de enviar', async () => {
    backend.respuestas['POST /api/notificaciones'] = { ok: true }
    const user = userEvent.setup()
    abrirApp('/avisar', conductor)
    await user.type(await screen.findByLabelText('Mensaje del aviso'), 'Nuevo')
    backend.respuestas['GET /api/notificaciones/mias'] = { notificaciones: [enviado(9, 'info', 'Nuevo', 0)] }
    await user.click(screen.getByRole('button', { name: /enviar aviso/i }))
    expect(await screen.findAllByText('Nuevo')).not.toHaveLength(0)
    expect(backend.llamadasA('GET', '/api/notificaciones/mias').length).toBeGreaterThanOrEqual(2)
  })
})

describe('Control de acceso', () => {
  it('un estudiante no entra a /avisar', async () => {
    abrirApp('/avisar', estudiante)
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('el conductor ya no entra a /notificaciones', async () => {
    abrirApp('/notificaciones', conductor)
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
