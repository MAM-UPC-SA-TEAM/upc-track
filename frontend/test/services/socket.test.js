import { describe, it, expect, vi, beforeEach } from 'vitest'

// socket.io-client falso: guarda los manejadores para poder simular «connect».
const h = vi.hoisted(() => {
  const manejadores = {}
  const socket = {
    connected: false,
    emit: vi.fn(),
    on: vi.fn((evento, cb) => { manejadores[evento] = cb }),
  }
  const creado = {}
  const io = (url, opciones) => { creado.opciones = opciones; return socket }
  return { manejadores, socket, io, creado }
})
vi.mock('socket.io-client', () => ({ io: h.io }))

const { default: socket, unirseRuta, salirRuta, olvidarRutas } = await import('../../src/services/socket')

beforeEach(() => {
  h.socket.connected = false
  h.socket.emit.mockClear()
  olvidarRutas()
})

describe('socket', () => {
  it('se crea sin conectar y envía el token guardado en la autenticación', () => {
    const opciones = h.creado.opciones
    expect(opciones.autoConnect).toBe(false)
    localStorage.setItem('token', 'tkn')
    expect(opciones.auth.token).toBe('tkn')
    expect(socket).toBe(h.socket)
  })

  it('unirseRuta conectado emite join:ruta', () => {
    h.socket.connected = true
    unirseRuta(3)
    expect(h.socket.emit).toHaveBeenCalledWith('join:ruta', { id_ruta: 3 })
  })

  it('unirseRuta desconectado no emite, pero se recuerda y se reenvía al conectar', () => {
    unirseRuta(3)
    unirseRuta(4)
    expect(h.socket.emit).not.toHaveBeenCalled()
    h.manejadores.connect()
    expect(h.socket.emit.mock.calls).toEqual([
      ['join:ruta', { id_ruta: 3 }],
      ['join:ruta', { id_ruta: 4 }],
    ])
  })

  it('salirRuta emite leave:ruta y la olvida', () => {
    h.socket.connected = true
    unirseRuta(3)
    salirRuta(3)
    expect(h.socket.emit).toHaveBeenLastCalledWith('leave:ruta', { id_ruta: 3 })
    h.socket.emit.mockClear()
    h.manejadores.connect()
    expect(h.socket.emit).not.toHaveBeenCalled()
  })

  it('salirRuta desconectado solo la olvida', () => {
    unirseRuta(3)
    salirRuta(3)
    expect(h.socket.emit).not.toHaveBeenCalled()
  })

  it('olvidarRutas evita arrastrar salas al siguiente usuario', () => {
    unirseRuta(3)
    olvidarRutas()
    h.manejadores.connect()
    expect(h.socket.emit).not.toHaveBeenCalled()
  })
})
