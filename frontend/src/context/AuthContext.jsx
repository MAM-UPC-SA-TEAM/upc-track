import { createContext, useContext, useState, useEffect } from 'react'
import socket, { olvidarRutas } from '../services/socket'
import { alReanudar } from '../services/cicloVida'
import { alCambiarRed } from '../services/red'
import api from '../services/api'

const AuthContext = createContext(null)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function normalizeUsuario(source) {
  if (!source || typeof source !== 'object') return null

  const nombre = source.nombre || source.name || source.usuario || null
  const tipoUsuario = source.tipo_usuario || source.tipoUsuario || source.rol || source.role || null

  if (!tipoUsuario) return null

  return {
    ...source,
    nombre: nombre || 'Usuario',
    tipo_usuario: tipoUsuario,
  }
}

function getUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch {
    localStorage.removeItem('usuario')
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const payload = parseJwt(token)
      if (payload && payload.exp * 1000 > Date.now()) {
        // Preferir el objeto de usuario guardado (tiene nombre_usuario y campos actualizados)
        // y caer al payload del JWT solo si no hay nada guardado
        const guardado = getUsuarioGuardado()
        setUsuario(guardado || payload)
        socket.connect()
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
      }
    }
    setCargando(false)
  }, [])

  function login(token, userData) {
    localStorage.setItem('token', token)
    const usuarioNormalizado = normalizeUsuario(userData)
    if (usuarioNormalizado) {
      localStorage.setItem('usuario', JSON.stringify(usuarioNormalizado))
      setUsuario(usuarioNormalizado)
      socket.connect()
    } else {
      // No debería pasar, pero si el backend devuelve algo inesperado
      // usamos el payload del JWT como fallback
      const payload = parseJwt(token)
      if (payload) {
        localStorage.setItem('usuario', JSON.stringify(payload))
        setUsuario(payload)
        socket.connect()
      }
    }
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout', {})
    } catch {
      // Si falla (token ya expirado) igual limpiamos localmente
    }
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    olvidarRutas()
    socket.disconnect()
  }

  // Volver de segundo plano o recuperar la red: el socket puede seguir «conectado» pero
  // muerto (el servidor ya lo descartó). Tras un rato fuera se recicla; al reconectar,
  // socket.js re-une las salas y cada pantalla refresca sus datos con su 'connect'.
  useEffect(() => {
    if (!usuario) return undefined
    const quitarReanudar = alReanudar((msFuera) => {
      if (msFuera >= 30_000 && socket.connected) socket.disconnect()
      if (!socket.connected) socket.connect()
    })
    const quitarRed = alCambiarRed((conectado) => {
      if (conectado && !socket.connected) socket.connect()
    })
    return () => { quitarReanudar(); quitarRed() }
  }, [usuario])

  useEffect(() => {
    if (!usuario) return

    let timer = null

    const reiniciarTemporizador = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        logout()
      }, INACTIVITY_TIMEOUT_MS)
    }

    const eventosActividad = [
      'click', 'keydown', 'mousemove', 'scroll', 'touchstart',
    ]

    eventosActividad.forEach((evento) => {
      window.addEventListener(evento, reiniciarTemporizador, { passive: true })
    })

    reiniciarTemporizador()

    return () => {
      if (timer) clearTimeout(timer)
      eventosActividad.forEach((evento) => {
        window.removeEventListener(evento, reiniciarTemporizador)
      })
    }
  }, [usuario])

  function actualizarUsuario(cambios) {
    setUsuario(prev => {
      const actualizado = { ...prev, ...cambios }
      localStorage.setItem('usuario', JSON.stringify(actualizado))
      return actualizado
    })
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext) || {
    usuario: null,
    cargando: false,
    login: () => {},
    logout: () => {},
    actualizarUsuario: () => {},
  }
}