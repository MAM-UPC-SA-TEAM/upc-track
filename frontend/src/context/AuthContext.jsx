import { createContext, useContext, useState, useEffect } from 'react'
import socket from '../services/socket'
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
    socket.disconnect()
  }

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