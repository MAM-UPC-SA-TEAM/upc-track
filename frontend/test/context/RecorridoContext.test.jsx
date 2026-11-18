// El recorrido del conductor sobrevive a la navegación: salir de «Mi recorrido» (a Alertas o Perfil)
// no apaga el GPS ni deja el bus inactivo; solo finalizar o cerrar sesión lo cierran. (Issue U11)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { backend } from '../helpers/mundoFalso'
import { AuthProvider } from '../../src/context/AuthContext'
import { watchPosition, verificarPermiso } from '../../src/services/geolocation'
import { RecorridoProvider, useRecorrido, useCerrarRecorrido } from '../../src/context/RecorridoContext'

vi.mock('../../src/services/api', async () => (await import('../helpers/mundoFalso.js')).moduloApiFalso)
vi.mock('../../src/services/socket', async () => (await import('../helpers/mundoFalso.js')).moduloSocketFalso)

const detener = vi.fn()
vi.mock('../../src/services/geolocation', () => ({
  disponible: () => true,
  watchPosition: vi.fn(() => ({ detener })),
  verificarPermiso: vi.fn(async () => {}),
}))

const conductor = { id_usuario: 2, nombre: 'Pedro', nombre_usuario: 'pedro', tipo_usuario: 'conductor' }
const estudiante = { id_usuario: 1, nombre: 'Ana', nombre_usuario: 'ana', tipo_usuario: 'estudiante' }

function iniciarSesion(usuario) {
  const exp = Math.floor(Date.now() / 1000) + 3600
  localStorage.setItem('token', `h.${btoa(JSON.stringify({ ...usuario, exp }))}.s`)
  localStorage.setItem('usuario', JSON.stringify(usuario))
}

// Pantalla mínima que hace lo que «Mi recorrido»: iniciar y mostrar el estado
function Pantalla() {
  const { enRecorrido, iniciarRecorrido, errorGps, estado } = useRecorrido()
  return (
    <>
      <p>{enRecorrido ? 'transmitiendo' : 'libre'}</p>
      <p data-testid="estado">{estado}</p>
      {errorGps && <p role="alert">{errorGps}</p>}
      <button onClick={iniciarRecorrido}>Iniciar</button>
    </>
  )
}

function Cierre() {
  const cerrar = useCerrarRecorrido()
  return <button onClick={cerrar}>Cerrar</button>
}

function App({ ver }) {
  return (
    <AuthProvider>
      <RecorridoProvider>
        {ver && <Pantalla />}
        <Cierre />
      </RecorridoProvider>
    </AuthProvider>
  )
}

const patchesInactivo = () => backend.llamadasA('PATCH', '/api/buses/7/estado').filter(l => l.cuerpo.estado === 'inactivo')

beforeEach(() => {
  backend.reset()
  detener.mockClear()
  localStorage.clear()
  backend.respuestas['GET /api/buses/mi-bus'] = { bus: { id_bus: 7, id_ruta: 1, estado: 'fuera_de_servicio' } }
})

describe('Recorrido del conductor', () => {
  it('salir de «Mi recorrido» no apaga el GPS ni deja el bus inactivo', async () => {
    iniciarSesion(conductor)
    const user = userEvent.setup()
    const { rerender } = render(<App ver />)
    await waitFor(() => expect(backend.llamadasA('GET', '/api/buses/mi-bus')).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: 'Iniciar' }))
    expect(await screen.findByText('transmitiendo')).toBeInTheDocument()

    // El conductor abre Alertas o Perfil: la pantalla se desmonta
    rerender(<App ver={false} />)
    await act(async () => {})
    expect(detener).not.toHaveBeenCalled()
    expect(patchesInactivo()).toHaveLength(0)

    // Y al volver sigue transmitiendo
    rerender(<App ver />)
    expect(screen.getByText('transmitiendo')).toBeInTheDocument()
  })

  it('cerrar sesión (cerrar el recorrido) apaga el GPS y deja el bus inactivo', async () => {
    iniciarSesion(conductor)
    const user = userEvent.setup()
    render(<App ver />)
    await waitFor(() => expect(backend.llamadasA('GET', '/api/buses/mi-bus')).toHaveLength(1))
    await user.click(screen.getByRole('button', { name: 'Iniciar' }))
    await screen.findByText('transmitiendo')

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(patchesInactivo()).toHaveLength(1))
    expect(detener).toHaveBeenCalled()
  })

  describe('permiso de ubicación (M12)', () => {
    const patchesEstado = (estado) => backend.llamadasA('PATCH', '/api/buses/7/estado').filter(l => l.cuerpo.estado === estado)
    const DENEGADO = { codigo: 'permiso_denegado', mensaje: 'Permiso de ubicación denegado. Actívalo en Ajustes.' }

    beforeEach(() => {
      watchPosition.mockClear()
      verificarPermiso.mockReset()
      verificarPermiso.mockResolvedValue(undefined)
    })

    it('con el permiso denegado el bus sigue fuera de servicio, no transmite y se explica cómo activarlo', async () => {
      iniciarSesion(conductor)
      verificarPermiso.mockRejectedValueOnce(DENEGADO)
      const user = userEvent.setup()
      render(<App ver />)
      await waitFor(() => expect(backend.llamadasA('GET', '/api/buses/mi-bus')).toHaveLength(1))

      await user.click(screen.getByRole('button', { name: 'Iniciar' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Permiso de ubicación denegado')
      expect(screen.getByText('libre')).toBeInTheDocument()
      expect(screen.getByTestId('estado')).toHaveTextContent('fuera_de_servicio')
      expect(watchPosition).not.toHaveBeenCalled()
      expect(patchesEstado('en_recorrido')).toHaveLength(0) // el servidor nunca vio «en recorrido»
    })

    it('al activar el permiso, «Iniciar» sirve de reintento: inicia normal y limpia el error', async () => {
      iniciarSesion(conductor)
      verificarPermiso.mockRejectedValueOnce(DENEGADO)
      const user = userEvent.setup()
      render(<App ver />)
      await waitFor(() => expect(backend.llamadasA('GET', '/api/buses/mi-bus')).toHaveLength(1))
      await user.click(screen.getByRole('button', { name: 'Iniciar' }))
      await screen.findByRole('alert')

      await user.click(screen.getByRole('button', { name: 'Iniciar' })) // ya concedido
      expect(await screen.findByText('transmitiendo')).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(patchesEstado('en_recorrido')).toHaveLength(1)
    })

    it('si el navegador deniega al preguntar (ya iniciado), se revierte a fuera de servicio y no queda «en recorrido»', async () => {
      iniciarSesion(conductor)
      // En web el permiso «por preguntar» pasa la verificación; la negativa llega después por el watch
      watchPosition.mockImplementationOnce((_ok, fallo) => { setTimeout(() => fallo(DENEGADO), 0); return { detener } })
      const user = userEvent.setup()
      render(<App ver />)
      await waitFor(() => expect(backend.llamadasA('GET', '/api/buses/mi-bus')).toHaveLength(1))

      await user.click(screen.getByRole('button', { name: 'Iniciar' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Permiso de ubicación denegado')
      expect(screen.getByText('libre')).toBeInTheDocument()
      expect(screen.getByTestId('estado')).toHaveTextContent('fuera_de_servicio')
      await waitFor(() => expect(patchesEstado('fuera_de_servicio')).toHaveLength(1))
      expect(detener).toHaveBeenCalled()
    })
  })

  it('un estudiante no carga ningún bus', async () => {
    iniciarSesion(estudiante)
    render(<App ver={false} />)
    await act(async () => {})
    expect(backend.llamadasA('GET', '/api/buses/mi-bus')).toHaveLength(0)
  })
})
