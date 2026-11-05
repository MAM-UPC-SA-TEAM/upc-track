import { useState, useEffect } from 'react'

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function useAuth() {
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const payload = parseJwt(token)
      if (payload) setUsuario(payload)
    }
  }, [])

  function login(token, userData) {
    localStorage.setItem('token', token)
    setUsuario(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    setUsuario(null)
  }

  return { usuario, login, logout }
}