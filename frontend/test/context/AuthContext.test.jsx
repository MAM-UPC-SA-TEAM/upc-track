import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Dependencias del contexto simuladas: sin red, sin socket real, sin Capacitor.
const m = vi.hoisted(() => ({
  socket: { connected: false, connect: vi.fn(), disconnect: vi.fn() },
  olvidarRutas: vi.fn(),
  api: { post: vi.fn() },
  reanudar: null, // callback registrado por AuthProvider en alReanudar
  red: null,      // callback registrado en alCambiarRed
  quitarReanudar: vi.fn(),
  quitarRed: vi.fn(),
}))
vi.mock('../../src/services/socket', () => ({ default: m.socket, olvidarRutas: m.olvidarRutas }))
vi.mock('../../src/services/api', () => ({ default: m.api }))
vi.mock('../../src/services/cicloVida', () => ({
  alReanudar: (cb) => { m.reanudar = cb; return m.quitarReanudar },
}))
vi.mock('../../src/services/red', () => ({
  alCambiarRed: (cb) => { m.red = cb; return m.quitarRed },
}))

const { AuthProvider, useAuth } = await import('../../src/context/AuthContext')

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
const jwt = (payload) => `h.${btoa(JSON.stringify(payload))}.s`
const enUnaHora = () => Math.floor(Date.now() / 1000) + 3600

const montar = () => renderHook(() => useAuth(), { wrapper })

beforeEach(() => {
  localStorage.clear()
  m.socket.connected = false
  m.socket.connect.mockClear()
  m.socket.disconnect.mockClear()
  m.olvidarRutas.mockClear()
  m.api.post.mockReset().mockResolvedValue({})
  m.quitarReanudar.mockClear()
  m.quitarRed.mockClear()
  m.reanudar = null
  m.red = null
})
afterEach(() => vi.useRealTimers())

describe('AuthProvider: arranque', () => {
  it('sin token termina de cargar sin usuario', () => {
    const { result } = montar()
    expect(result.current.cargando).toBe(false)
    expect(result.current.usuario).toBeNull()
    expect(m.socket.connect).not.toHaveBeenCalled()
  })

  it('token válido sin usuario guardado usa el payload del JWT y conecta el socket', () => {
    localStorage.setItem('token', jwt({ id_usuario: 1, tipo_usuario: 'admin', exp: enUnaHora() }))
    const { result } = montar()
    expect(result.current.usuario.tipo_usuario).toBe('admin')
    expect(m.socket.connect).toHaveBeenCalledTimes(1)
  })

  it('prefiere el usuario guardado sobre el payload', () => {
    localStorage.setItem('token', jwt({ id_usuario: 1, tipo_usuario: 'admin', exp: enUnaHora() }))
    localStorage.setItem('usuario', JSON.stringify({ id_usuario: 1, nombre: 'Ana', nombre_usuario: 'ana', tipo_usuario: 'admin' }))
    const { result } = montar()
    expect(result.current.usuario.nombre_usuario).toBe('ana')
  })

  it('usuario guardado corrupto se descarta y se usa el payload', () => {
    localStorage.setItem('token', jwt({ id_usuario: 1, tipo_usuario: 'estudiante', exp: enUnaHora() }))
    localStorage.setItem('usuario', '{no es json')
    const { result } = montar()
    expect(result.current.usuario.tipo_usuario).toBe('estudiante')
    expect(localStorage.getItem('usuario')).toBeNull()
  })

  it('token vencido se borra y no hay sesión', () => {
    localStorage.setItem('token', jwt({ tipo_usuario: 'admin', exp: 1 }))
    localStorage.setItem('usuario', '{"x":1}')
    const { result } = montar()
    expect(result.current.usuario).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('usuario')).toBeNull()
    expect(m.socket.connect).not.toHaveBeenCalled()
  })

  it('token ilegible se borra', () => {
    localStorage.setItem('token', 'basura')
    const { result } = montar()
    expect(result.current.usuario).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

describe('AuthProvider: login', () => {
  it('guarda token y usuario normalizado y conecta el socket', () => {
    const { result } = montar()
    act(() => result.current.login('tok', { nombre: 'Ana', rol: 'conductor' }))
    expect(localStorage.getItem('token')).toBe('tok')
    expect(result.current.usuario).toMatchObject({ nombre: 'Ana', tipo_usuario: 'conductor' })
    expect(JSON.parse(localStorage.getItem('usuario')).tipo_usuario).toBe('conductor')
    expect(m.socket.connect).toHaveBeenCalled()
  })

  it('sin nombre usa «Usuario» como nombre por defecto', () => {
    const { result } = montar()
    act(() => result.current.login('tok', { tipoUsuario: 'estudiante' }))
    expect(result.current.usuario).toMatchObject({ nombre: 'Usuario', tipo_usuario: 'estudiante' })
  })

  it('si el backend no manda un usuario válido cae al payload del JWT', () => {
    const { result } = montar()
    act(() => result.current.login(jwt({ id_usuario: 9, tipo_usuario: 'admin' }), { sin: 'rol' }))
    expect(result.current.usuario.id_usuario).toBe(9)
  })

  it('si tampoco el JWT sirve, no inicia sesión', () => {
    const { result } = montar()
    act(() => result.current.login('basura', null))
    expect(result.current.usuario).toBeNull()
    expect(m.socket.connect).not.toHaveBeenCalled()
  })
})

describe('AuthProvider: logout', () => {
  async function conSesion() {
    const hook = montar()
    act(() => hook.result.current.login('tok', { nombre: 'Ana', tipo_usuario: 'estudiante' }))
    return hook
  }

  it('avisa al backend, limpia el almacenamiento y cierra el socket', async () => {
    const { result } = await conSesion()
    await act(async () => { await result.current.logout() })
    expect(m.api.post).toHaveBeenCalledWith('/api/auth/logout', {})
    expect(result.current.usuario).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(m.olvidarRutas).toHaveBeenCalled()
    expect(m.socket.disconnect).toHaveBeenCalled()
  })

  it('cierra la sesión local aunque el backend falle', async () => {
    m.api.post.mockRejectedValue({ status: 401 })
    const { result } = await conSesion()
    await act(async () => { await result.current.logout() })
    expect(result.current.usuario).toBeNull()
    expect(localStorage.getItem('usuario')).toBeNull()
  })
})

describe('AuthProvider: actualizarUsuario', () => {
  it('mezcla los cambios y los persiste', () => {
    const { result } = montar()
    act(() => result.current.login('tok', { nombre: 'Ana', tipo_usuario: 'estudiante' }))
    act(() => result.current.actualizarUsuario({ nombre: 'Ana María' }))
    expect(result.current.usuario).toMatchObject({ nombre: 'Ana María', tipo_usuario: 'estudiante' })
    expect(JSON.parse(localStorage.getItem('usuario')).nombre).toBe('Ana María')
  })
})

describe('AuthProvider: socket al reanudar o recuperar la red', () => {
  const iniciar = () => {
    const hook = montar()
    act(() => hook.result.current.login('tok', { nombre: 'Ana', tipo_usuario: 'estudiante' }))
    m.socket.connect.mockClear()
    return hook
  }

  it('sin sesión no se registran oyentes', () => {
    montar()
    expect(m.reanudar).toBeNull()
    expect(m.red).toBeNull()
  })

  it('tras 30 s o más fuera con el socket conectado lo recicla', () => {
    iniciar()
    m.socket.connected = true
    m.socket.disconnect.mockImplementation(() => { m.socket.connected = false })
    act(() => m.reanudar(45_000))
    expect(m.socket.disconnect).toHaveBeenCalled()
    expect(m.socket.connect).toHaveBeenCalled()
  })

  it('tras poco tiempo fuera con el socket conectado no hace nada', () => {
    iniciar()
    m.socket.connected = true
    act(() => m.reanudar(5_000))
    expect(m.socket.disconnect).not.toHaveBeenCalled()
    expect(m.socket.connect).not.toHaveBeenCalled()
  })

  it('al reanudar con el socket caído lo reconecta', () => {
    iniciar()
    act(() => m.reanudar(1_000))
    expect(m.socket.connect).toHaveBeenCalled()
  })

  it('al volver la red reconecta solo si estaba caído', () => {
    iniciar()
    act(() => m.red(true))
    expect(m.socket.connect).toHaveBeenCalledTimes(1)
    m.socket.connect.mockClear()
    m.socket.connected = true
    act(() => m.red(true))
    act(() => m.red(false))
    expect(m.socket.connect).not.toHaveBeenCalled()
  })

  it('al cerrar sesión se quitan los oyentes', async () => {
    const { result } = iniciar()
    await act(async () => { await result.current.logout() })
    expect(m.quitarReanudar).toHaveBeenCalled()
    expect(m.quitarRed).toHaveBeenCalled()
  })
})

describe('AuthProvider: cierre por inactividad', () => {
  it('cierra sesión tras 30 min sin actividad', async () => {
    vi.useFakeTimers()
    const { result } = montar()
    act(() => result.current.login('tok', { nombre: 'Ana', tipo_usuario: 'estudiante' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(30 * 60 * 1000 + 10) })
    expect(m.api.post).toHaveBeenCalledWith('/api/auth/logout', {})
    expect(result.current.usuario).toBeNull()
  })

  it('la actividad del usuario reinicia el temporizador', async () => {
    vi.useFakeTimers()
    const { result } = montar()
    act(() => result.current.login('tok', { nombre: 'Ana', tipo_usuario: 'estudiante' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(20 * 60 * 1000) })
    act(() => { window.dispatchEvent(new Event('click')) })
    await act(async () => { await vi.advanceTimersByTimeAsync(20 * 60 * 1000) })
    expect(result.current.usuario).not.toBeNull()
    await act(async () => { await vi.advanceTimersByTimeAsync(11 * 60 * 1000) })
    expect(result.current.usuario).toBeNull()
  })
})

describe('useAuth fuera del proveedor', () => {
  it('devuelve un valor inerte en lugar de fallar', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.usuario).toBeNull()
    expect(result.current.cargando).toBe(false)
    expect(() => { result.current.login(); result.current.logout(); result.current.actualizarUsuario() }).not.toThrow()
  })
})
